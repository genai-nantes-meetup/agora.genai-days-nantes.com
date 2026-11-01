import {track} from '@/lib/analytics';
import {lengthBucket} from '@/lib/analytics-rules';
import { useTrackView } from '@/hooks/use-track-view';
import {createFileRoute,Link} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {lazy,Suspense,useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {RealtimeChannel} from '@supabase/supabase-js';
import {Send,ArrowLeft,User,Reply,Pencil,Trash2,Smile,X,SmilePlus} from 'lucide-react';
import {useServerFn} from '@tanstack/react-start';
import {sendMessage} from '@/lib/messaging.functions';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {LoadingView,ErrorView} from '@/components/common';
import {useI18n} from '@/lib/i18n';
import {useAuth} from '@/lib/auth';
import {useMessaging,inboxOptions} from '@/lib/messaging-client';
import {membersOptions} from '@/lib/member-queries';
import {Icebreakers} from '@/components/Icebreakers';
import {supabase} from '@/integrations/supabase/client';
import {messagingReadOnly,mergeMessages,canModifyMessage,REACTIONS,PAGE_SIZE,EDIT_WINDOW_MS,SEND_RETRY_GIVE_UP_MS,TYPING_TTL_MS,HEARTBEAT_MS,dayKey,sameGroup,type ChatMessage} from '@/lib/messaging';

const EmojiPicker=lazy(()=>import('@/components/EmojiPicker'));

export const Route=createFileRoute('/_authenticated/messages/$id')({head:()=>({meta:[{title:'Conversation · GenAI Days Nantes'},{name:'description',content:'Votre conversation privée aux GenAI Days.'},{property:'og:title',content:'Conversation · GenAI Days Nantes'},{property:'og:description',content:'Échanges privés entre participant·es.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:ConversationPage});

type Local=ChatMessage&{status?:'sending'|'failed'|undefined;firstTry?:number|undefined;error?:string|undefined};
type ReactionRow={message_id:string;user_id:string;emoji:string};

function ConversationPage(){
 const {id}=Route.useParams();const {user}=useAuth();const {t,lang}=useI18n();const {refresh}=useMessaging();
 const sendFn=useServerFn(sendMessage);
 const q=useQuery(inboxOptions(user?.id??''));const members=useQuery(membersOptions());
 const row=q.data?.conversations.find(c=>c.id===id);const otherId=row?(row.user_a===user?.id?row.user_b:row.user_a):undefined;const other=members.data?.find(p=>p.user_id===otherId);
 const me=user?.id??'';
 const [messages,setMessages]=useState<Local[]>([]);const [reactions,setReactions]=useState<ReactionRow[]>([]);const [quoted,setQuoted]=useState<Record<string,ChatMessage>>({});
 const [otherRead,setOtherRead]=useState<string|null>(null);const [typing,setTyping]=useState(false);
 const [loaded,setLoaded]=useState(false);const [loadFailed,setLoadFailed]=useState(false);const [hasMore,setHasMore]=useState(false);const [loadingOlder,setLoadingOlder]=useState(false);
 const [text,setText]=useState('');const fromIcebreaker=useRef(false);useTrackView('conversation_opened',{conversation_id:id});const [replyTo,setReplyTo]=useState<ChatMessage|null>(null);const [editing,setEditing]=useState<ChatMessage|null>(null);
 const [active,setActive]=useState<string|null>(null);const [closed,setClosed]=useState(messagingReadOnly());const [notice,setNotice]=useState<string|null>(null);
 const [pickerOpen,setPickerOpen]=useState(false);const [finePointer,setFinePointer]=useState(false);const [highlight,setHighlight]=useState<string|null>(null);
 const channelRef=useRef<RealtimeChannel|null>(null);const messagesRef=useRef<Local[]>([]);messagesRef.current=messages;
 const lastTyping=useRef(0);const typingTimer=useRef<ReturnType<typeof setTimeout>|null>(null);const lastMarked=useRef<string|null>(null);
 const end=useRef<HTMLDivElement|null>(null);const top=useRef<HTMLDivElement|null>(null);const inputRef=useRef<HTMLTextAreaElement|null>(null);
 const scrollMode=useRef<'bottom'|{height:number}|null>('bottom');const longPress=useRef<ReturnType<typeof setTimeout>|null>(null);
 const open=!!row&&!row.closed_at;

 useEffect(()=>{setFinePointer(window.matchMedia('(pointer: fine)').matches);const timer=setInterval(()=>setClosed(messagingReadOnly()),10000);return()=>clearInterval(timer);},[]);

 const loadReactions=useCallback(async(ids:string[])=>{if(!ids.length)return;const {data}=await supabase.from('message_reactions').select('message_id,user_id,emoji').in('message_id',ids);if(data)setReactions(old=>[...old.filter(r=>!ids.includes(r.message_id)),...data]);},[]);
 const loadQuoted=useCallback(async(list:ChatMessage[])=>{const known=new Set(messagesRef.current.map(m=>m.id));const missing=[...new Set(list.map(m=>m.reply_to_id).filter((x):x is string=>!!x&&!known.has(x)))];if(!missing.length)return;const {data}=await supabase.from('messages').select('*').in('id',missing);if(data)setQuoted(old=>({...old,...Object.fromEntries(data.map(m=>[m.id,m]))}));},[]);
 const loadReceipt=useCallback(async()=>{if(!otherId)return;const {data}=await supabase.from('conversation_receipts').select('last_read_message_id').eq('conversation_id',id).eq('user_id',otherId).maybeSingle();if(data)setOtherRead(data.last_read_message_id);},[id,otherId]);
 const merge=useCallback((incoming:ChatMessage[])=>{setMessages(old=>{const confirmed=new Set(incoming.map(m=>m.id));return mergeMessages(old.map(m=>confirmed.has(m.id)?{...m,status:undefined,firstTry:undefined,error:undefined}:m),incoming.map(m=>({...m,status:undefined}))) as Local[];});},[]);

 // Initial page (latest 50).
 useEffect(()=>{if(!open)return;let live=true;setLoaded(false);setLoadFailed(false);setMessages([]);setReactions([]);scrollMode.current='bottom';
  void (async()=>{const {data,error}=await supabase.from('messages').select('*').eq('conversation_id',id).order('created_at',{ascending:false}).limit(PAGE_SIZE);if(!live)return;if(error){setLoadFailed(true);return;}const list=[...data].reverse();merge(list);setHasMore(data.length===PAGE_SIZE);setLoaded(true);void loadReactions(list.map(m=>m.id));void loadQuoted(list);void loadReceipt();})();
  return()=>{live=false;};},[id,open]);

 // Catch-up after reconnect or refocus: new messages plus anything still editable.
 const catchUp=useCallback(async()=>{const server=messagesRef.current.filter(m=>!m.status);const last=server.at(-1);const since=last?new Date(Date.parse(last.created_at)-EDIT_WINDOW_MS).toISOString():null;let query=supabase.from('messages').select('*').eq('conversation_id',id).order('created_at',{ascending:true}).limit(500);if(since)query=query.gt('created_at',since);const {data}=await query;if(data){merge(data);void loadReactions(data.map(m=>m.id));void loadQuoted(data);}void loadReceipt();},[id,merge,loadReactions,loadQuoted,loadReceipt]);

 // Private realtime channel for this conversation.
 useEffect(()=>{if(!open||!me)return;const channel=supabase.channel(`conversation:${id}`,{config:{private:true,broadcast:{self:false}}})
  .on('broadcast',{event:'message'},({payload})=>{merge([payload as ChatMessage]);void loadQuoted([payload as ChatMessage]);if((payload as ChatMessage).sender_id!==me)setTyping(false);})
  .on('broadcast',{event:'message_update'},({payload})=>{merge([payload as ChatMessage]);if((payload as ChatMessage).deleted_at)setReactions(old=>old.filter(r=>r.message_id!==(payload as ChatMessage).id));})
  .on('broadcast',{event:'reaction'},({payload})=>{const p=payload as ReactionRow&{op:string};setReactions(old=>{const rest=old.filter(r=>!(r.message_id===p.message_id&&r.user_id===p.user_id&&r.emoji===p.emoji));return p.op==='INSERT'?[...rest,{message_id:p.message_id,user_id:p.user_id,emoji:p.emoji}]:rest;});})
  .on('broadcast',{event:'read'},({payload})=>{const p=payload as {user_id:string;last_read_message_id:string|null};if(p.user_id!==me)setOtherRead(p.last_read_message_id);})
  .on('broadcast',{event:'typing'},({payload})=>{if((payload as {user?:string}).user===me)return;setTyping(true);if(typingTimer.current)clearTimeout(typingTimer.current);typingTimer.current=setTimeout(()=>setTyping(false),TYPING_TTL_MS);})
  .subscribe(status=>{if(status==='SUBSCRIBED')void catchUp();});
  channelRef.current=channel;
  const onVisible=()=>{if(document.visibilityState==='visible')void catchUp();};document.addEventListener('visibilitychange',onVisible);window.addEventListener('online',onVisible);
  return()=>{channelRef.current=null;document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('online',onVisible);if(typingTimer.current)clearTimeout(typingTimer.current);void supabase.removeChannel(channel);};
 },[id,open,me]);

 // Presence heartbeat (suppresses push while the conversation is open and visible).
 useEffect(()=>{if(!open)return;const beat=()=>{if(document.visibilityState==='visible')void supabase.rpc('conversation_heartbeat',{p_conversation_id:id}).then(()=>{},()=>{});};beat();const timer=setInterval(beat,HEARTBEAT_MS);document.addEventListener('visibilitychange',beat);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',beat);};},[id,open]);

 // Mark the latest message as read when visible.
 useEffect(()=>{const read=()=>{const last=messagesRef.current.filter(m=>!m.status).at(-1);if(!last||document.visibilityState!=='visible'||lastMarked.current===last.id||last.sender_id===me)return;lastMarked.current=last.id;void supabase.rpc('mark_read',{p_conversation_id:id,p_message_id:last.id}).then(({error})=>{if(error)lastMarked.current=null;else refresh();});};read();document.addEventListener('visibilitychange',read);return()=>document.removeEventListener('visibilitychange',read);},[messages,id,me]);

 // Scrolling: stick to bottom for new messages, keep position when older ones load.
 useLayoutEffect(()=>{const mode=scrollMode.current;if(mode==='bottom')end.current?.scrollIntoView({block:'end'});else if(mode)window.scrollBy(0,document.documentElement.scrollHeight-mode.height);scrollMode.current=null;},[messages]);
 const nearBottom=()=>window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-200;
 useEffect(()=>{if(nearBottom())scrollMode.current='bottom';});

 const loadOlder=useCallback(async()=>{const first=messagesRef.current.find(m=>!m.status);if(!first||loadingOlder)return;setLoadingOlder(true);const {data,error}=await supabase.from('messages').select('*').eq('conversation_id',id).lt('created_at',first.created_at).order('created_at',{ascending:false}).limit(PAGE_SIZE);setLoadingOlder(false);if(error||!data)return;scrollMode.current={height:document.documentElement.scrollHeight};merge(data.reverse());setHasMore(data.length===PAGE_SIZE);void loadReactions(data.map(m=>m.id));},[id,loadingOlder,merge,loadReactions]);
 useEffect(()=>{const el=top.current;if(!el||!hasMore)return;const io=new IntersectionObserver(e=>{if(e[0]?.isIntersecting)void loadOlder();},{rootMargin:'200px'});io.observe(el);return()=>io.disconnect();},[hasMore,loadOlder]);

 // Sending with idempotent retries on the same id.
 const attempt=useCallback(async(m:Local)=>{
  try{const r=await sendFn({data:{id:m.id,conversationId:id,body:m.body,replyTo:m.reply_to_id}});
   if(r.ok){merge([r.message]);return;}
   if(r.code!=='Unavailable'){track('message_send_failed',{conversation_id:id});setMessages(old=>old.map(x=>x.id===m.id?{...x,status:'failed',error:r.code}:x));if(r.code==='ReadOnly')setClosed(true);return;}
  }catch{/* network: retry below */}
  const started=m.firstTry??Date.now();
  if(Date.now()-started>=SEND_RETRY_GIVE_UP_MS){track('message_send_failed',{conversation_id:id});setMessages(old=>old.map(x=>x.id===m.id?{...x,status:'failed'}:x));return;}
  setTimeout(()=>{const current=messagesRef.current.find(x=>x.id===m.id);if(current?.status==='sending')void attempt(current);},Math.min(8000,1000*2**Math.floor((Date.now()-started)/4000)));
 },[id,sendFn,merge]);

 function submit(bodyOverride?:string){
  const body=(bodyOverride??text).trim();if(!body||closed||messagingReadOnly())return;
  if(editing&&bodyOverride===undefined){const target=editing;setEditing(null);setText('');void supabase.rpc('edit_message',{p_id:target.id,p_body:body}).then(({data,error})=>{if(error||!data)setNotice(t('messages.actionFailed'));else{track('message_edited',{conversation_id:id});merge([data as ChatMessage]);}});return;}
  const m:Local={id:crypto.randomUUID(),conversation_id:id,sender_id:me,body,reply_to_id:replyTo?.id??null,created_at:new Date().toISOString(),edited_at:null,deleted_at:null,status:'sending',firstTry:Date.now()};
  track('message_sent',{conversation_id:id,is_reply:!!replyTo,length_bucket:lengthBucket(body.length),from_icebreaker:fromIcebreaker.current||bodyOverride!==undefined?'yes':'no'});fromIcebreaker.current=false;
  if(replyTo)setQuoted(old=>({...old,[replyTo.id]:replyTo}));
  scrollMode.current='bottom';setMessages(old=>[...old,m]);if(bodyOverride===undefined)setText('');setReplyTo(null);setPickerOpen(false);void attempt(m);
 }
 function retry(m:Local){track('message_retried',{conversation_id:id});const fresh={...m,status:'sending' as const,firstTry:Date.now(),error:undefined};setMessages(old=>old.map(x=>x.id===m.id?fresh:x));void attempt(fresh);}
 function onType(value:string){setText(value);const now=Date.now();if(value&&now-lastTyping.current>2000&&channelRef.current){lastTyping.current=now;void channelRef.current.send({type:'broadcast',event:'typing',payload:{user:me}});}}
 function react(m:ChatMessage,emoji:string){setActive(null);const mine=reactions.some(r=>r.message_id===m.id&&r.user_id===me&&r.emoji===emoji);setReactions(old=>mine?old.filter(r=>!(r.message_id===m.id&&r.user_id===me&&r.emoji===emoji)):[...old,{message_id:m.id,user_id:me,emoji}]);track('reaction_toggled',{conversation_id:id,emoji,action:mine?'removed':'added'});void supabase.rpc('toggle_reaction',{p_message_id:m.id,p_emoji:emoji}).then(({error})=>{if(error){void loadReactions([m.id]);setNotice(t('messages.actionFailed'));}});}
 function remove(m:ChatMessage){setActive(null);if(!window.confirm(t('messages.deleteConfirm')))return;void supabase.rpc('delete_message',{p_id:m.id}).then(({data,error})=>{if(error||!data)setNotice(t('messages.actionFailed'));else{track('message_deleted',{conversation_id:id});merge([data as ChatMessage]);}});}
 function startEdit(m:ChatMessage){setActive(null);setReplyTo(null);setEditing(m);setText(m.body);inputRef.current?.focus();}
 function jumpTo(target:string){const el=document.getElementById(`m-${target}`);if(!el)return;el.scrollIntoView({block:'center',behavior:'smooth'});setHighlight(target);setTimeout(()=>setHighlight(null),1500);}
 const findMessage=(mid:string)=>messages.find(m=>m.id===mid)??quoted[mid];
 const nameOf=(uid:string)=>uid===me?t('messages.you'):other?`${other.first_name} ${other.last_name}`:t('directory.participant');
 const time=(iso:string)=>new Date(iso).toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'});
 const day=(iso:string)=>new Date(iso).toLocaleDateString(lang,{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Paris'});

 if(q.isPending)return <LoadingView/>;if(q.isError)return <ErrorView onRetry={()=>q.refetch()}/>;if(!open)return <p className="p-5">{t('connection.blocked')}</p>;
 const myLast=[...messages].reverse().find(m=>m.sender_id===me&&!m.status);const readAt=otherRead?messages.find(m=>m.id===otherRead)?.created_at:undefined;const seen=!!myLast&&!!readAt&&Date.parse(readAt)>=Date.parse(myLast.created_at);
 return <section className="flex min-h-[70dvh] flex-col px-5 py-5" onClick={e=>{if(!(e.target as HTMLElement).closest('[data-msg]'))setActive(null);}}>
  <header className="flex items-center gap-3 border-b pb-4"><Button asChild variant="ghost" size="icon" aria-label={t('back')}><Link to="/messages"><ArrowLeft/></Link></Button>{other?.avatar?<img src={other.avatar} alt="" className="size-11 rounded-full object-cover"/>:<User className="size-8"/>}<Link to="/networking/$id" params={{id:otherId??''}} className="min-w-0 break-words font-display text-2xl font-bold">{other?`${other.first_name} ${other.last_name}`:t('nav.messages')}</Link></header>
  <div className="flex-1 py-5" aria-live="polite">
   <div ref={top}/>{hasMore&&<p className="pb-3 text-center text-xs text-muted-foreground">{loadingOlder?t('loading'):<button type="button" className="underline" onClick={()=>void loadOlder()}>{t('messages.loadOlder')}</button>}</p>}
   {loadFailed&&<div className="py-10 text-center"><p className="mb-3 text-sm text-destructive">{t('messages.unavailable')}</p><Button variant="outline" onClick={()=>void catchUp().then(()=>{setLoadFailed(false);setLoaded(true);})}>{t('retry')}</Button></div>}
   {!loaded&&!loadFailed&&<p className="py-16 text-center text-sm text-muted-foreground">{t('loading')}</p>}
   {loaded&&!messages.length&&<p className="py-10 text-center text-sm text-muted-foreground">{t('messages.first')}</p>}
   {loaded&&!messages.length&&!closed&&<Icebreakers id={id} onChoose={v=>{fromIcebreaker.current=true;setText(v);inputRef.current?.focus();}} onSend={body=>submit(body)}/>}
   {messages.map((m,i)=>{const prev=messages[i-1];const mine=m.sender_id===me;const grouped=sameGroup(prev,m);const newDay=!prev||dayKey(prev.created_at)!==dayKey(m.created_at);const quote=m.reply_to_id?findMessage(m.reply_to_id):undefined;const counts=REACTIONS.map(e=>({e,n:reactions.filter(r=>r.message_id===m.id&&r.emoji===e).length,mineR:reactions.some(r=>r.message_id===m.id&&r.emoji===e&&r.user_id===me)})).filter(x=>x.n>0);const modifiable=!m.status&&canModifyMessage(m,me);const actionable=!m.status&&!m.deleted_at&&!closed;
    return <div key={m.id}>
     {newDay&&<p className="my-4 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">{day(m.created_at)}</p>}
     <div id={`m-${m.id}`} data-msg className={`group relative flex ${mine?'justify-end':'justify-start'} ${grouped&&!newDay?'mt-1':'mt-3'}`}
      onTouchStart={()=>{if(!actionable)return;longPress.current=setTimeout(()=>setActive(m.id),450);}} onTouchEnd={()=>{if(longPress.current)clearTimeout(longPress.current);}} onTouchMove={()=>{if(longPress.current)clearTimeout(longPress.current);}} onContextMenu={e=>{if(actionable&&!finePointer){e.preventDefault();setActive(m.id);}}}>
      <div className={`max-w-[85%] ${mine?'items-end':'items-start'} flex flex-col`}>
       <div className={`ph-no-capture rounded-md px-4 py-2.5 transition-shadow ${highlight===m.id?'ring-2 ring-primary':''} ${m.deleted_at?'border border-dashed bg-transparent text-muted-foreground':mine?'bg-secondary text-secondary-foreground':'bg-surface'} ${m.status==='sending'?'opacity-70':''}`}>
        {quote&&!m.deleted_at&&<button type="button" onClick={()=>jumpTo(quote.id)} className="mb-1.5 block w-full border-l-2 border-current pl-2 text-left text-xs opacity-80"><span className="font-bold">{nameOf(quote.sender_id)}</span><span className="line-clamp-2 break-words">{quote.deleted_at?t('messages.deleted'):quote.body}</span></button>}
        <p className={`whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere] ${m.deleted_at?'italic':'font-normal'}`}>{m.deleted_at?t('messages.deleted'):m.body}</p>
        <p className="mt-1 text-right text-[10px] opacity-75">{m.edited_at&&!m.deleted_at&&<span>{t('messages.edited')} · </span>}{time(m.created_at)}</p>
       </div>
       {counts.length>0&&<div className="-mt-1 flex flex-wrap gap-1">{counts.map(c=><button key={c.e} type="button" disabled={!actionable} onClick={()=>react(m,c.e)} aria-pressed={c.mineR} className={`rounded-full border bg-background px-1.5 text-xs ${c.mineR?'border-primary':''}`}>{c.e} {c.n}</button>)}</div>}
       {m.status==='sending'&&<p className="text-[10px] text-muted-foreground">{t('messages.sending')}</p>}
       {m.status==='failed'&&<button type="button" onClick={()=>retry(m)} className="text-[11px] font-bold text-destructive underline">{m.error==='RateLimited'?t('messages.rateLimited'):m.error==='ReadOnly'?t('messages.closed'):t('messages.failedRetry')}</button>}
       {mine&&seen&&myLast?.id===m.id&&<p className="text-[10px] text-muted-foreground">{t('messages.seen')}</p>}
      </div>
      {actionable&&<div role="toolbar" aria-label={t('messages.actions')} className={`absolute -top-9 z-10 items-center gap-0.5 rounded-full border bg-popover px-1.5 py-1 shadow-md ${mine?'right-0':'left-0'} ${active===m.id?'flex':'hidden'} ${finePointer?'group-hover:flex':''}`}>
       {REACTIONS.map(e=><button key={e} type="button" className="rounded-full px-1 text-lg hover:bg-surface" aria-label={`${t('messages.react')} ${e}`} onClick={()=>react(m,e)}>{e}</button>)}
       <button type="button" className="rounded-full p-1 hover:bg-surface" aria-label={t('messages.reply')} onClick={()=>{setActive(null);setEditing(null);setReplyTo(m);inputRef.current?.focus();}}><Reply className="size-4"/></button>
       {modifiable&&<><button type="button" className="rounded-full p-1 hover:bg-surface" aria-label={t('messages.edit')} onClick={()=>startEdit(m)}><Pencil className="size-4"/></button><button type="button" className="rounded-full p-1 text-destructive hover:bg-surface" aria-label={t('messages.delete')} onClick={()=>remove(m)}><Trash2 className="size-4"/></button></>}
      </div>}
      {actionable&&!finePointer&&active!==m.id&&<button type="button" aria-label={t('messages.actions')} onClick={()=>setActive(m.id)} className={`self-center px-1 text-muted-foreground ${mine?'order-first':''}`}><SmilePlus className="size-4"/></button>}
     </div>
    </div>;})}
   {typing&&<p className="mt-3 text-xs italic text-muted-foreground">{t('messages.typing',{name:other?.first_name??t('directory.participant')})}</p>}
   <div ref={end}/>
  </div>
  {notice&&<p role="alert" className="mb-3 text-sm text-destructive" onClick={()=>setNotice(null)}>{notice}</p>}
  {closed?<p className="border-t pt-4 text-sm text-muted-foreground">{t('messages.closed')}</p>:
  <form className="sticky bottom-16 border-t bg-background py-3 lg:bottom-0" onSubmit={e=>{e.preventDefault();submit();}}>
   {(replyTo||editing)&&<div className="ph-no-capture mb-2 flex items-start gap-2 border-l-2 border-primary pl-2 text-xs"><div className="min-w-0 flex-1"><p className="font-bold">{editing?t('messages.editing'):t('messages.replyingTo',{name:nameOf(replyTo!.sender_id)})}</p><p className="line-clamp-1 break-words text-muted-foreground">{(editing??replyTo)!.body}</p></div><button type="button" aria-label={t('messages.cancel')} onClick={()=>{if(editing)setText('');setEditing(null);setReplyTo(null);}}><X className="size-4"/></button></div>}
   <div className="relative flex items-end gap-2">
    {finePointer&&<div className="relative"><Button type="button" variant="ghost" size="icon" className="size-12" aria-label={t('messages.emoji')} aria-expanded={pickerOpen} onClick={()=>setPickerOpen(v=>!v)}><Smile className="size-5"/></Button>{pickerOpen&&<div className="absolute bottom-14 left-0 z-20"><Suspense fallback={null}><EmojiPicker label={t('messages.emoji')} onPick={e=>{setText(v=>v+e);inputRef.current?.focus();}}/></Suspense></div>}</div>}
    <Textarea ref={inputRef} aria-label={t('messages.compose')} placeholder={t('messages.compose')} value={text} maxLength={1600} className="ph-no-capture min-h-12 resize-none" onChange={e=>onType(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();}else if(e.key==='Escape'&&(editing||replyTo)){setEditing(null);setReplyTo(null);}}}/>
    <Button type="submit" size="icon" className="size-12 shrink-0" aria-label={editing?t('messages.saveEdit'):t('messages.send')} disabled={!text.trim()}><Send className="size-5"/></Button>
   </div>
  </form>}
 </section>;
}
