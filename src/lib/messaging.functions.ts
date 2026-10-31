import {createServerFn} from '@tanstack/react-start';
import {setResponseHeader} from '@tanstack/react-start/server';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
const uuid=z.object({id:z.string().uuid()});
export const inbox=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 setResponseHeader('Cache-Control','no-store');
 const {data:active}=await context.supabase.rpc('is_active_member',{uid:context.userId});if(!active)throw new Error('Forbidden');
 const [requests,conversations]=await Promise.all([context.supabase.rpc('member_connections'),context.supabase.from('conversations').select('*')]);
 if(requests.error||conversations.error)throw new Error('Unavailable');
 // A declined response is deliberately indistinguishable from pending for the sender.
 return {requests:requests.data.map(r=>({...r,status:r.requester_id===context.userId&&r.status==='declined'?'pending':r.status})),conversations:conversations.data};
});
export const sendConnection=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(uuid).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');const {data:before}=await context.supabase.rpc('member_connections');const existing=before?.some(r=>[r.requester_id,r.recipient_id].includes(data.id));const {data:id,error}=await context.supabase.rpc('request_connection',{target:data.id});if(error||!id)throw new Error('Forbidden');if(!existing){const {notifyRequest}=await import('./notifications.server');await notifyRequest(id).catch(()=>{});}return {id};
});
export const declineConnection=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(uuid).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');const {error}=await context.supabase.rpc('decline_connection',{request:data.id});if(error)throw new Error('Forbidden');return {ok:true};
});
export const acceptConnection=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(uuid).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');const {data:visible,error}=await context.supabase.rpc('member_connections');const r=visible?.find(x=>x.id===data.id);if(error||!r||r.recipient_id!==context.userId||r.cancelled_at)throw new Error('Forbidden');
 if(r.status==='accepted'){const {data:c}=await context.supabase.from('conversations').select('id').eq('request_id',r.id).single();if(c)return {id:c.id};}
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const claim=crypto.randomUUID();const {data:reserved,error:reserveError}=await supabaseAdmin.rpc('claim_connection_accept',{request:r.id,actor:context.userId,claim});if(reserveError||!reserved)throw new Error('Unavailable');
 const {provisionConversation,closeTwilioConversation}=await import('./twilio.server');let sid:string|null=null;
 try{const c=await provisionConversation(r.id,r.requester_id,r.recipient_id);sid=c.sid;const {data:id,error:finishError}=await supabaseAdmin.rpc('finish_connection_accept',{request:r.id,claim,sid:c.sid,pa:c.pa,pb:c.pb});if(finishError||!id)throw new Error('Cancelled');return {id};}
 catch(error){if(sid)await closeTwilioConversation(sid).catch(()=>{});await supabaseAdmin.from('connection_requests').update({provisioning_at:null,provisioning_claim:null}).eq('id',r.id).eq('provisioning_claim',claim);throw error;}
});
export const twilioToken=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 setResponseHeader('Cache-Control','no-store');const {data:active}=await context.supabase.rpc('is_active_member',{uid:context.userId});if(!active)throw new Error('Forbidden');const {issueTwilioToken}=await import('./twilio.server');return {token:await issueTwilioToken(context.userId)};
});
export const blockMember=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(uuid).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');const {error}=await context.supabase.from('blocks').insert({blocker_id:context.userId,blocked_id:data.id});if(error)throw new Error('Forbidden');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:rows}=await supabaseAdmin.from('conversations').select('id,conversation_sid').or(`and(user_a.eq.${context.userId},user_b.eq.${data.id}),and(user_b.eq.${context.userId},user_a.eq.${data.id})`).not('closed_at','is',null).is('twilio_closed_at',null);
 const {closeTwilioConversation}=await import('./twilio.server');for(const c of rows??[]){if(!c.conversation_sid)continue;try{await closeTwilioConversation(c.conversation_sid);await supabaseAdmin.from('conversations').update({twilio_closed_at:new Date().toISOString()}).eq('id',c.id);}catch{console.error('Conversation closure awaiting reconciliation');}}
 return {ok:true};
});