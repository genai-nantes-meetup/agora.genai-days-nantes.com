import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useQuery,queryOptions,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import type {Client,Conversation} from '@twilio/conversations';
import {inbox,twilioToken} from './messaging.functions';
import {useAuth} from './auth';
import {supabase} from '@/integrations/supabase/client';
export const inboxOptions=(uid:string)=>queryOptions({queryKey:['inbox',uid],queryFn:()=>inbox(),staleTime:10000});
type Context={client:Client|null;error:boolean;unread:number;refresh:()=>void};
const MessagingContext=createContext<Context>({client:null,error:false,unread:0,refresh:()=>{}});
export function MessagingProvider({children}:{children:ReactNode}){
 const {user}=useAuth();const qc=useQueryClient();const getToken=useServerFn(twilioToken);const [client,setClient]=useState<Client|null>(null);const [error,setError]=useState(false);const [unread,setUnread]=useState(0);const ref=useRef<Client|null>(null);
 const q=useQuery({...inboxOptions(user?.id??''),enabled:!!user});
 const refresh=()=>{void qc.invalidateQueries({queryKey:['inbox']});};
 useEffect(()=>{if(!user)return;const channel=supabase.channel(`inbox-${user.id}-${crypto.randomUUID()}`).on('postgres_changes',{event:'*',schema:'public',table:'connection_requests'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'conversations'},refresh).subscribe();return()=>{void supabase.removeChannel(channel);};},[user?.id,qc]);
 useEffect(()=>{
  if(!user||!q.data?.conversations.some(c=>!c.closed_at&&c.conversation_sid))return;
  let stopped=false;let current:Client|null=null;
  const count=async()=>{if(!current)return;try{let total=0;let page=await current.getSubscribedConversations();const all:Conversation[]=[...page.items];while(page.hasNextPage){page=await page.nextPage();all.push(...page.items);}for(const c of all)if(c.state.current!=='closed')total+=await c.getUnreadMessagesCount()??0;if(!stopped)setUnread(total);}catch{if(!stopped)setError(true);}};
  void (async()=>{try{const {Client}=await import('@twilio/conversations');const {token}=await getToken();if(stopped)return;current=new Client(token);ref.current=current;current.on('tokenAboutToExpire',()=>{void getToken().then(r=>current?.updateToken(r.token)).catch(()=>setError(true));});current.on('tokenExpired',()=>{void getToken().then(r=>current?.updateToken(r.token)).catch(()=>setError(true));});current.on('connectionStateChanged',state=>{if(stopped)return;if(state==='connected'){setClient(current);setError(false);void count();}else if(state==='denied'){setError(true);}});current.on('messageAdded',()=>{void count();refresh();});current.on('conversationUpdated',()=>{void count();});current.on('conversationRemoved',()=>{void count();refresh();});}catch{if(!stopped)setError(true);}})();
  return()=>{stopped=true;setClient(null);setUnread(0);ref.current=null;void current?.shutdown();};
 },[user?.id,!!q.data?.conversations.some(c=>!c.closed_at&&c.conversation_sid)]);
 useEffect(()=>{if(!user){setUnread(0);setClient(null);setError(false);qc.removeQueries({queryKey:['inbox']});}},[user?.id,qc]);
 useEffect(()=>{const n=navigator as Navigator&{setAppBadge?:(n:number)=>Promise<void>;clearAppBadge?:()=>Promise<void>};if(unread)void n.setAppBadge?.(unread).catch(()=>{});else void n.clearAppBadge?.().catch(()=>{});},[unread]);
 return <MessagingContext.Provider value={{client,error,unread,refresh}}>{children}</MessagingContext.Provider>;
}
export const useMessaging=()=>useContext(MessagingContext);