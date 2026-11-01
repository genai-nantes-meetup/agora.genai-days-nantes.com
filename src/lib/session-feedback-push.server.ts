import fr from '@/locales/fr.json';
import {feedbackPushDue,displayTitle,type SessionsPayload} from './event';
const EVENT_DATE='2026-11-17';
function parisNow(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return {day:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
/** Sends one rating push per eligible session to every active member with notifications on at send time; each session is claimed once in session_feedback_pushes. */
export async function runSessionFeedbackPushes(){
 const {day,time}=parisNow();if(day!==EVENT_DATE)return {sent:[] as string[]};
 const res=await fetch('https://genai-days-nantes.com/api/fr/sessions.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!res.ok)throw new Error('SessionsUnavailable');
 const payload=await res.json() as SessionsPayload;const due=feedbackPushDue(payload.sessions,EVENT_DATE,day,time);if(!due.length)return {sent:[] as string[]};
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {pushToUser}=await import('./notifications.server');
 const sent:string[]=[];
 for(const s of due){
  const {data:claimed,error}=await supabaseAdmin.from('session_feedback_pushes').upsert({session_id:s.id},{onConflict:'session_id',ignoreDuplicates:true}).select('session_id');if(error)throw error;if(!claimed?.length)continue;
  const {data:subs}=await supabaseAdmin.from('push_subscriptions').select('user_id');const users=[...new Set((subs??[]).map(r=>r.user_id))];
  const active=(await Promise.all(users.map(async u=>{const {data}=await supabaseAdmin.rpc('is_active_member',{uid:u});return data?u:null;}))).filter(Boolean) as string[];
  const body=fr['push.rateBody'].replace('{title}',displayTitle(s));
  await Promise.allSettled(active.map(u=>pushToUser(u,{title:fr['push.rateTitle'],body,url:`/sessions/${s.id}?from_push=session_feedback#feedback`,tag:`feedback-${s.id}`})));
  await supabaseAdmin.from('session_feedback_pushes').update({recipients:active.length}).eq('session_id',s.id);sent.push(s.id);
 }
 return {sent};
}
