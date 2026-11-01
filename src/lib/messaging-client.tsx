import {createContext,useContext,useEffect,type ReactNode} from 'react';
import {useQuery,queryOptions,useQueryClient} from '@tanstack/react-query';
import {inbox} from './messaging.functions';
import {useAuth} from './auth';
import {supabase} from '@/integrations/supabase/client';
export const inboxOptions=(uid:string)=>queryOptions({queryKey:['inbox',uid],queryFn:()=>inbox(),staleTime:10000});
type Context={error:boolean;unread:number;refresh:()=>void};
const MessagingContext=createContext<Context>({error:false,unread:0,refresh:()=>{}});
export function MessagingProvider({children}:{children:ReactNode}){
 const {user}=useAuth();const qc=useQueryClient();
 const q=useQuery({...inboxOptions(user?.id??''),enabled:!!user});
 const refresh=()=>{void qc.invalidateQueries({queryKey:['inbox']});};
 // Private per-user doorbell: refreshes the inbox list and unread badges.
 useEffect(()=>{if(!user)return;const channel=supabase.channel(`inbox:${user.id}`,{config:{private:true}}).on('broadcast',{event:'changed'},()=>{refresh();void qc.invalidateQueries({queryKey:['members']});}).subscribe(status=>{if(status==='SUBSCRIBED')refresh();});return()=>{void supabase.removeChannel(channel);};},[user?.id,qc]);
 // Catch up after the tab comes back (flaky venue Wi-Fi, phone sleep).
 useEffect(()=>{if(!user)return;const on=()=>{if(document.visibilityState==='visible')refresh();};document.addEventListener('visibilitychange',on);window.addEventListener('online',on);return()=>{document.removeEventListener('visibilitychange',on);window.removeEventListener('online',on);};},[user?.id]);
 useEffect(()=>{if(!user)qc.removeQueries({queryKey:['inbox']});},[user?.id,qc]);
 const unread=user?(q.data?.summaries??[]).reduce((n,s)=>n+(s.unread??0),0):0;
 useEffect(()=>{const n=navigator as Navigator&{setAppBadge?:(n:number)=>Promise<void>;clearAppBadge?:()=>Promise<void>};if(unread)void n.setAppBadge?.(unread).catch(()=>{});else void n.clearAppBadge?.().catch(()=>{});},[unread]);
 return <MessagingContext.Provider value={{error:q.isError,unread,refresh}}>{children}</MessagingContext.Provider>;
}
export const useMessaging=()=>useContext(MessagingContext);
