import { createFileRoute,Link,Outlet } from "@tanstack/react-router";
import {useQuery} from '@tanstack/react-query';
import {useEffect,useState} from 'react';
import {MessageCircle,User} from 'lucide-react';
import {LoadingView,ErrorView} from '@/components/common';
import {Button} from '@/components/ui/button';
import {ConnectionAction} from '@/components/ConnectionAction';
import {useAuth} from '@/lib/auth';
import {useI18n} from '@/lib/i18n';
import {membersOptions} from '@/lib/member-queries';
import {inboxOptions,useMessaging} from '@/lib/messaging-client';
import {useRouterState} from '@tanstack/react-router';
import {PushInvitation} from '@/components/PushInvitation';

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Messages · GenAI Days Nantes" },
      { name: "description", content: "Demandes de connexion et conversations privées aux GenAI Days." },
      { property: "og:title", content: "Messages · GenAI Days Nantes" },
      { property: "og:description", content: "Vos échanges avec les participant·es des GenAI Days." },
    ],
  }),
  component: MessagesLayout,
});
function MessagesLayout(){const path=useRouterState({select:s=>s.location.pathname});return <><PushInvitation/>{path==='/messages'?<InboxPage/>:<Outlet/>}</>;}
function InboxPage(){
 const {user}=useAuth();const {t,lang}=useI18n();const q=useQuery(inboxOptions(user?.id??''));const members=useQuery(membersOptions());const {client,error}=useMessaging();const [details,setDetails]=useState<Record<string,{last:string;date:Date|null;unread:number}>>({});
 useEffect(()=>{if(!client||!q.data)return;let live=true;void Promise.all(q.data.conversations.filter(c=>c.conversation_sid&&!c.closed_at).map(async c=>{try{const conversation=await client.getConversationBySid(c.conversation_sid as string);const [messages,unread]=await Promise.all([conversation.getMessages(1),conversation.getUnreadMessagesCount()]);const m=messages.items.at(-1);return [c.id,{last:m?.body??'',date:m?.dateCreated??null,unread:unread??0}] as const;}catch{return null;}})).then(rows=>{if(live)setDetails(Object.fromEntries(rows.filter(x=>x!==null)));});return()=>{live=false;};},[client,q.data]);
 if(q.isPending||members.isPending)return <LoadingView/>;if(q.isError||members.isError)return <ErrorView onRetry={()=>{void q.refetch();void members.refetch();}}/>;
 const incoming=q.data.requests.filter(r=>r.recipient_id===user?.id&&r.status==='pending'&&!r.cancelled_at);const conversations=q.data.conversations.filter(c=>!c.closed_at).sort((a,b)=>(details[b.id]?.date?.getTime()??Date.parse(b.created_at))-(details[a.id]?.date?.getTime()??Date.parse(a.created_at)));
 return <div className="px-5 py-6"><h1 className="mb-6 text-4xl">{t('nav.messages')}</h1>{incoming.length>0&&<section className="mb-8"><h2 className="mb-3 text-2xl">{t('messages.requests')} <span className="font-sans text-sm">({incoming.length})</span></h2><ul className="divide-y border-y">{incoming.map(r=>{const p=members.data.find(x=>x.user_id===r.requester_id);return <li key={r.id} className="space-y-3 py-4"><Link to="/networking/$id" params={{id:r.requester_id}} className="flex items-center gap-3">{p?.avatar?<img src={p.avatar} alt="" className="size-12 rounded-full object-cover"/>:<User className="size-8"/>}<span className="font-display text-xl font-bold">{p?`${p.first_name} ${p.last_name}`:t('directory.participant')}</span></Link><ConnectionAction target={r.requester_id}/></li>;})}</ul></section>}<section><h2 className="mb-3 text-2xl">{t('messages.conversations')}</h2>{error&&<p className="mb-3 text-sm text-destructive">{t('messages.unavailable')}</p>}{conversations.length?<ul className="divide-y border-y">{conversations.map(c=>{const p=members.data.find(x=>x.user_id===(c.user_a===user?.id?c.user_b:c.user_a));const d=details[c.id];return <li key={c.id}><Link to="/messages/$id" params={{id:c.id}} className="flex min-w-0 items-center gap-3 py-4">{p?.avatar?<img src={p.avatar} alt="" className="size-14 shrink-0 rounded-full object-cover"/>:<span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface"><MessageCircle/></span>}<div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-2"><h3 className="truncate text-xl font-bold">{p?`${p.first_name} ${p.last_name}`:t('directory.participant')}</h3><time className="shrink-0 text-[10px] text-muted-foreground">{d?.date?.toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit'})}</time></div><p className="truncate text-sm text-muted-foreground">{d?.last||t('messages.first')}</p></div>{!!d?.unread&&<span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground" aria-label={t('messages.unread',{n:d.unread})}>{d.unread}</span>}</Link></li>;})}</ul>:<div className="py-12 text-center"><MessageCircle className="mx-auto mb-4 size-10 text-secondary"/><p className="mb-5 text-sm text-muted-foreground">{t('messages.empty')}</p><Button asChild variant="outline"><Link to="/networking">{t('messages.start')}</Link></Button></div>}</section></div>;
}
