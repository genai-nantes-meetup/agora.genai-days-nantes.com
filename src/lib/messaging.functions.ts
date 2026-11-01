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
 setResponseHeader('Cache-Control','no-store');const {data:before}=await context.supabase.rpc('member_connections');const existing=before?.some(r=>[r.requester_id,r.recipient_id].includes(data.id));const {data:id,error}=await context.supabase.rpc('request_connection',{target:data.id});if(error||!id)throw new Error('Forbidden');if(!existing){const {notifyRequest}=await import('./notifications.server');await notifyRequest(id).catch(()=>{});}const {emailConnectionRequest}=await import('./app-emails.server');await emailConnectionRequest(id).catch(()=>console.error('Request email failed'));return {id};
});
export const declineConnection=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(uuid).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');const {error}=await context.supabase.rpc('decline_connection',{request:data.id});if(error)throw new Error('Forbidden');return {ok:true};
});
export const acceptConnection=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(uuid).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');const {data:visible,error}=await context.supabase.rpc('member_connections');const r=visible?.find(x=>x.id===data.id);if(error||!r||r.recipient_id!==context.userId||r.cancelled_at)throw new Error('Forbidden');
 if(r.status==='accepted'){const {data:c}=await context.supabase.from('conversations').select('id').eq('request_id',r.id).single();if(c)return {id:c.id};}
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const claim=crypto.randomUUID();const {data:reserved,error:reserveError}=await supabaseAdmin.rpc('claim_connection_accept',{request:r.id,actor:context.userId,claim});if(reserveError||!reserved)throw new Error('Unavailable');
 const {data:id,error:finishError}=await supabaseAdmin.rpc('finish_connection_accept',{request:r.id,claim});
 if(finishError||!id){await supabaseAdmin.from('connection_requests').update({provisioning_at:null,provisioning_claim:null}).eq('id',r.id).eq('provisioning_claim',claim);throw new Error('Cancelled');}
 const {emailConnectionAccepted}=await import('./app-emails.server');await emailConnectionAccepted(r.id,id).catch(()=>console.error('Accepted email failed'));return {id};
});
const PERMANENT=['Forbidden','ReadOnly','InvalidBody','InvalidReply','RateLimited'] as const;
export type SendResult={ok:true;message:import('./messaging').ChatMessage}|{ok:false;code:(typeof PERMANENT)[number]|'Unavailable'};
/** Idempotent on the client-generated id; push is attempted only for a newly created message and never fails the send. */
export const sendMessage=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid(),conversationId:z.string().uuid(),body:z.string().trim().min(1).max(1600),replyTo:z.string().uuid().nullable()})).handler(async({data,context}):Promise<SendResult>=>{
 setResponseHeader('Cache-Control','no-store');
 const {data:result,error}=await context.supabase.rpc('send_message',{p_id:data.id,p_conversation_id:data.conversationId,p_body:data.body,p_reply_to_id:data.replyTo??undefined});
 if(error){const code=PERMANENT.find(c=>error.message.includes(c));return {ok:false,code:code??'Unavailable'};}
 const r=result as {message:import('./messaging').ChatMessage;created:boolean};
 if(r.created){try{const {notifyMessage}=await import('./notifications.server');await notifyMessage(r.message.id);}catch{console.error('Message push failed');}}
 return {ok:true,message:r.message};
});
export const blockMember=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(uuid).handler(async({data,context})=>{
 // The database trigger cancels the pair's requests and closes their conversation.
 setResponseHeader('Cache-Control','no-store');const {error}=await context.supabase.from('blocks').insert({blocker_id:context.userId,blocked_id:data.id});if(error)throw new Error('Forbidden');return {ok:true};
});
