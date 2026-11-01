import {createServerFn} from '@tanstack/react-start';
import {setResponseHeader} from '@tanstack/react-start/server';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {profileSchema} from './networking';
const tokenSchema=z.string().min(32).max(128).regex(/^[a-f0-9]+$/);
export const prefillLinkedIn=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({linkedin_url:profileSchema.shape.linkedin_url,lang:z.enum(['fr','en'])})).handler(async({data})=>{
 setResponseHeader('Cache-Control','no-store');
 try{
  const {findSpeakerProfile}=await import('./networking');
  const response=await fetch(`https://genai-days-nantes.com/api/${data.lang}/speakers.json`,{cache:'no-store',signal:AbortSignal.timeout(4000)});
  if(!response.ok)return {profile:null};
  const payload=await response.json() as import('./event').SpeakersPayload;
  const speaker=findSpeakerProfile(data.linkedin_url,payload.speakers);
  if(!speaker)return {profile:null};
  const [first_name,...last]=speaker.name.trim().split(/\s+/);
  return {profile:{first_name:first_name??'',last_name:last.join(' '),job_title:speaker.role??null,company:speaker.company??null}};
 }catch{return {profile:null};}
});
export const checkInvitation=createServerFn({method:'POST'}).inputValidator(z.object({token:tokenSchema})).handler(async({data})=>{
 setResponseHeader('Cache-Control','no-store');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:row,error}=await supabaseAdmin.from('invitations').select('email,used_at').eq('token',data.token).maybeSingle();if(error)throw new Error('unavailable');return row&&!row.used_at?{valid:true,email:row.email}:{valid:false,email:null};
});
export const redeemInvitation=createServerFn({method:'POST'}).inputValidator(z.object({token:tokenSchema,profile:profileSchema})).handler(async({data})=>{
 setResponseHeader('Cache-Control','no-store');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const claim=crypto.randomUUID();const {data:email,error}=await supabaseAdmin.rpc('claim_invitation',{invite_token:data.token,claim});if(error||!email)throw new Error('invalidInvitation');
 let uid:string|null=null;
 try {
  const {data:existing,error:findError}=await supabaseAdmin.from('profiles').select('user_id').eq('email',data.profile.email).maybeSingle();if(findError)throw findError;if(existing)throw new Error('existingAccount');
  const {data:created,error:createError}=await supabaseAdmin.auth.admin.createUser({email:data.profile.email,email_confirm:true,password:crypto.randomUUID()+crypto.randomUUID(),app_metadata:{invitation_signup:true,ownership_verified:false}});if(createError||!created.user)throw new Error('existingAccount');uid=created.user.id;
  const {error:finishError}=await supabaseAdmin.rpc('complete_invitation',{invite_token:data.token,claim,uid,fields:data.profile});if(finishError)throw finishError;
  const {recalculateStatus}=await import('./members.server');await recalculateStatus(uid,data.profile.email,data.profile.linkedin_url);
  const {data:link,error:linkError}=await supabaseAdmin.auth.admin.generateLink({type:'magiclink',email:data.profile.email});if(linkError||!link.properties.hashed_token)throw new Error('unavailable');
  return {token_hash:link.properties.hashed_token};
 }catch(e){if(uid){await supabaseAdmin.auth.admin.deleteUser(uid);await supabaseAdmin.from('invitations').update({used_at:null}).eq('token',data.token);}await supabaseAdmin.from('invitations').update({claim_id:null,claimed_at:null}).eq('token',data.token).eq('claim_id',claim);throw e;}
});
export const requestMagicLink=createServerFn({method:'POST'}).inputValidator(z.object({email:z.string().trim().email().max(254),origin:z.string().url()})).handler(async({data})=>{
 setResponseHeader('Cache-Control','no-store');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {getRequest}=await import('@tanstack/react-start/server');const origin=new URL(getRequest().url).origin;if(data.origin!==origin)throw new Error('invalidOrigin');
 const {error:sendError}=await supabaseAdmin.auth.signInWithOtp({email:data.email.toLowerCase(),options:{shouldCreateUser:true,emailRedirectTo:`${origin}/login`}});if(sendError)throw new Error('unavailable');return {exists:true};
});
export const saveProfile=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(profileSchema).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:current,error}=await context.supabase.from('profiles').select('email,consent_at').eq('user_id',context.userId).single();if(error)throw error;
 const {consent,email,...fields}=data;
 if(email!==current.email){const {error:emailError}=await context.supabase.auth.updateUser({email});if(emailError)throw new Error('unavailable');}
 const {error:saveError}=await context.supabase.from('profiles').update({...fields,consent_at:current.consent_at??new Date().toISOString()}).eq('user_id',context.userId);if(saveError)throw saveError;
 const {recalculateStatus}=await import('./members.server');await recalculateStatus(context.userId,current.email,data.linkedin_url);return {emailPending:email!==current.email};
});
export const deleteAccount=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 setResponseHeader('Cache-Control','no-store');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:conversations,error:readError}=await supabaseAdmin.from('conversations').select('conversation_sid').or(`user_a.eq.${context.userId},user_b.eq.${context.userId}`);if(readError)throw new Error('unavailable');const {deleteTwilioConversation}=await import('./twilio.server');for(const c of conversations??[]){if(c.conversation_sid)await deleteTwilioConversation(c.conversation_sid);}const {error:photoError}=await supabaseAdmin.storage.from('avatars').remove([`${context.userId}/avatar.jpg`]);if(photoError)throw new Error('unavailable');const {error}=await supabaseAdmin.auth.admin.deleteUser(context.userId);if(error)throw new Error('unavailable');return {ok:true};
});
export const listBlocked=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 setResponseHeader('Cache-Control','no-store');const {data:blocks,error}=await context.supabase.from('blocks').select('blocked_id').eq('blocker_id',context.userId);if(error)throw error;if(!blocks.length)return [];
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:rows,error:readError}=await supabaseAdmin.from('profiles').select('user_id,first_name,last_name').in('user_id',blocks.map(x=>x.blocked_id));if(readError)throw readError;return rows;
});