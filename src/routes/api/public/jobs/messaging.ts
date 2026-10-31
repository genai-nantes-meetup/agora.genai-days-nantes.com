import {createFileRoute} from '@tanstack/react-router';
import {authenticateCronRequest} from '@/integrations/supabase/cron-auth';
export const Route=createFileRoute('/api/public/jobs/messaging')({server:{handlers:{POST:async({request})=>{
 const denied=await authenticateCronRequest(request);if(denied)return denied;
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {deleteTwilioConversation}=await import('@/lib/twilio.server');
 const [closed,deleted]=await Promise.all([supabaseAdmin.from('conversations').select('id,conversation_sid').not('closed_at','is',null).is('twilio_closed_at',null).limit(20),supabaseAdmin.from('twilio_cleanup').select('conversation_sid').limit(20)]);
 let cleared=0;for(const c of closed.data??[]){if(!c.conversation_sid)continue;try{await deleteTwilioConversation(c.conversation_sid);await supabaseAdmin.from('conversations').update({twilio_closed_at:new Date().toISOString()}).eq('id',c.id);cleared++;}catch{}}
 for(const c of deleted.data??[]){try{await deleteTwilioConversation(c.conversation_sid);await supabaseAdmin.from('twilio_cleanup').delete().eq('conversation_sid',c.conversation_sid);cleared++;}catch{}}
 return Response.json({cleared},{headers:{'Cache-Control':'no-store'}});
}}}});