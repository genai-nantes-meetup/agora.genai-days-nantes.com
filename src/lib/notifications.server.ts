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
/** Push for a new message: sender name only, never the body. Skipped while the recipient has the conversation open. */
export async function notifyMessage(messageId:string){
 const {pushSuppressed}=await import('./messaging');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:m}=await supabaseAdmin.from('messages').select('id,conversation_id,sender_id').eq('id',messageId).single();if(!m)return;
 const {data:c}=await supabaseAdmin.from('conversations').select('id,user_a,user_b,closed_at').eq('id',m.conversation_id).single();if(!c||c.closed_at)return;
 const recipientId=c.user_a===m.sender_id?c.user_b:c.user_a;
 const {data:presence}=await supabaseAdmin.from('conversation_presence').select('last_seen_at').eq('conversation_id',c.id).eq('user_id',recipientId).maybeSingle();if(pushSuppressed(presence?.last_seen_at))return;
 const {data:profiles}=await supabaseAdmin.from('profiles').select('user_id,first_name,last_name,lang').in('user_id',[m.sender_id,recipientId]);const sender=profiles?.find(p=>p.user_id===m.sender_id);const recipient=profiles?.find(p=>p.user_id===recipientId);if(!sender||!recipient)return;
 const dict=recipient.lang==='en'?en:fr;const name=`${sender.first_name} ${sender.last_name}`.trim();
 await pushToUser(recipientId,{title:'GenAI Days',body:dict['messages.pushBody'].replace('{name}',name),url:`/messages/${c.id}`,tag:`conversation-${c.id}`});
}
export async function notifyRequest(id:string){
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:r}=await supabaseAdmin.from('connection_requests').select('*').eq('id',id).single();if(!r||r.cancelled_at||r.status!=='pending')return;
 const {data:profiles}=await supabaseAdmin.from('profiles').select('user_id,first_name,last_name,lang').in('user_id',[r.requester_id,r.recipient_id]);const sender=profiles?.find(p=>p.user_id===r.requester_id);const recipient=profiles?.find(p=>p.user_id===r.recipient_id);if(!sender||!recipient)return;
 const dict=recipient.lang==='en'?en:fr;await pushToUser(r.recipient_id,{title:`${sender.first_name} ${sender.last_name}`,body:dict['messages.requests'],url:'/messages',tag:`request-${r.id}`});
}