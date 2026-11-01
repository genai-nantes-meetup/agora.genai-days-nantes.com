import accs from '/tmp/mt/accs.json';
import { supabaseAdmin as db } from '@/integrations/supabase/client.server';
import * as m from '@/lib/app-emails.server';
import { sendTemplateEmail } from '@/lib/email-templates/send-email';
const [A,B]=accs as any[];const log=(...a:any[])=>console.log(...a);
const {data:i1}=await db.from('invitations').insert({email:A.address,first_name:'Testa',last_name:'Fr'}).select().single();
const {data:i2}=await db.from('invitations').insert({email:B.address,first_name:'Testb',last_name:'En'}).select().single();
log('invite1',await m.sendInvitation(i1!.id));log('invite1 again',await m.sendInvitation(i1!.id));log('resend',await m.sendInvitation(i1!.id,{resend:true}));
await m.autoSendLateInvitation(B.address);log('auto off sent_at',(await db.from('invitations').select('invitation_sent_at').eq('id',i2!.id).single()).data);
await db.from('email_settings').update({auto_send_late_invites:true}).eq('id',true);await m.autoSendLateInvitation(B.address);await db.from('email_settings').update({auto_send_late_invites:false}).eq('id',true);
log('auto on sent_at',(await db.from('invitations').select('invitation_sent_at').eq('id',i2!.id).single()).data);
await db.from('invitations').delete().in('id',[i1!.id,i2!.id]);
const ids:string[]=[];
for(const [acc,lang,fn] of [[A,'fr','Testa'],[B,'en','Testb']] as const){const {data,error}=await db.auth.admin.createUser({email:acc.address,email_confirm:true});if(error)throw error;ids.push(data.user.id);const {error:pe}=await db.from('profiles').upsert({user_id:data.user.id,email:acc.address,first_name:fn,last_name:'Test',linkedin_url:`https://www.linkedin.com/in/${fn.toLowerCase()}-${Date.now()}`,lang,intentions:['meet'],job_tags:['tech'],consent_at:new Date().toISOString()});if(pe)log('profile err',pe.message);}
try{
const {data:r,error:re}=await db.from('connection_requests').insert({requester_id:ids[0],recipient_id:ids[1]}).select().single();if(re)throw re;
await m.emailConnectionRequest(r.id);await m.emailConnectionRequest(r.id);log('request sent_at',(await db.from('connection_requests').select('request_email_sent_at').eq('id',r.id).single()).data);
await db.from('connection_requests').update({status:'accepted',responded_at:new Date().toISOString()}).eq('id',r.id);
const {data:c,error:ce}=await db.from('conversations').insert({request_id:r.id,conversation_sid:'CH'+'0'.repeat(32),user_a:ids[0],user_b:ids[1],participant_a_sid:'MB'+'0'.repeat(32),participant_b_sid:'MB'+'1'.repeat(32)}).select().single();if(ce)throw ce;
await db.from('conversation_receipts').insert([{conversation_id:c.id,user_id:ids[0]},{conversation_id:c.id,user_id:ids[1]}]);
await m.emailConnectionAccepted(r.id,c.id);await m.emailConnectionAccepted(r.id,c.id);log('accepted sent_at',(await db.from('connection_requests').select('accepted_email_sent_at').eq('id',r.id).single()).data);
await db.from('message_events').insert({message_sid:'IM'+'2'.repeat(32),conversation_id:c.id,sender_id:ids[0],recipient_id:ids[1],message_index:0,excerpt:'',created_at:new Date(Date.now()-600000).toISOString()});
log('reminder job (twilio)',await m.runUnreadReminders());
log('reminder direct',await sendTemplateEmail('unread-reminder',B.address,{templateData:{lang:'en',senderName:'Testa Test',url:`https://hey.genai-days-nantes.com/messages/${c.id}`},idempotencyKey:`test-reminder-${c.id}`}));
}finally{for(const id of ids){await db.from('profiles').delete().eq('user_id',id);await db.auth.admin.deleteUser(id);}log('cleanup done')}
