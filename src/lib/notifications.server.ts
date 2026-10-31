import {buildPushPayload} from '@block65/webcrypto-web-push';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';
const allowedPushHosts=['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns2-bl2p.notify.windows.com'];
export function validPushEndpoint(endpoint:string){const u=new URL(endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(allowedPushHosts.includes(u.hostname)||u.hostname.endsWith('.notify.windows.com'));}
export async function pushToUser(uid:string,payload:{title:string;body:string;url:string;tag:string}){
 const publicKey=process.env['VAPID_PUBLIC_KEY'];const privateKey=process.env['VAPID_PRIVATE_KEY'];if(!publicKey||!privateKey)return false;
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:rows,error}=await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id',uid);if(error)throw error;
 await Promise.all((rows??[]).map(async s=>{if(!validPushEndpoint(s.endpoint))return;const request=await buildPushPayload({data:JSON.stringify(payload),options:{ttl:300}},{endpoint:s.endpoint,expirationTime:null,keys:{p256dh:s.p256dh,auth:s.auth}},{publicKey,privateKey,subject:'https://hey.genai-days-nantes.com/donnees'});const response=await fetch(s.endpoint,{...request,signal:AbortSignal.timeout(4000)});if([404,410].includes(response.status))await supabaseAdmin.from('push_subscriptions').delete().eq('id',s.id);else if(!response.ok)throw new Error('PushDeliveryFailed');}));return true;
}
export async function notifyMessage(sid:string){
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:e}=await supabaseAdmin.from('message_events').select('*').eq('message_sid',sid).single();if(!e||e.push_attempted_at)return;
 const {data:sender}=await supabaseAdmin.from('profiles').select('first_name,last_name').eq('user_id',e.sender_id).single();if(!sender)return;
 const sent=await pushToUser(e.recipient_id,{title:`${sender.first_name} ${sender.last_name}`,body:e.excerpt,url:`/messages/${e.conversation_id}`,tag:`message-${e.message_sid}`});if(sent)await supabaseAdmin.from('message_events').update({push_attempted_at:new Date().toISOString()}).eq('message_sid',sid);
}
export async function notifyRequest(id:string){
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:r}=await supabaseAdmin.from('connection_requests').select('*').eq('id',id).single();if(!r||r.cancelled_at||r.status!=='pending')return;
 const {data:profiles}=await supabaseAdmin.from('profiles').select('user_id,first_name,last_name,lang').in('user_id',[r.requester_id,r.recipient_id]);const sender=profiles?.find(p=>p.user_id===r.requester_id);const recipient=profiles?.find(p=>p.user_id===r.recipient_id);if(!sender||!recipient)return;
 const dict=recipient.lang==='en'?en:fr;await pushToUser(r.recipient_id,{title:`${sender.first_name} ${sender.last_name}`,body:dict['messages.requests'],url:'/messages',tag:`request-${r.id}`});
}