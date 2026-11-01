import {createServerFn} from '@tanstack/react-start';
import {setResponseHeader} from '@tanstack/react-start/server';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
export const pushConfiguration=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async()=>{setResponseHeader('Cache-Control','no-store');return {publicKey:process.env['VAPID_PUBLIC_KEY']??null};});
export const subscribePush=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({endpoint:z.string().url().max(2048),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]+$/).min(80).max(300),auth:z.string().regex(/^[A-Za-z0-9_-]+$/).min(16).max(100)})})).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');
 const {validPushEndpoint}=await import('./notifications.server');
 if(!validPushEndpoint(data.endpoint))return {ok:false,error:'push.endpointFailed'} as const;
 const {data:active,error:membershipError}=await context.supabase.rpc('is_active_member',{uid:context.userId});
 if(membershipError){console.error('[push-registration] membership check failed',membershipError.code);return {ok:false,error:'push.saveFailed'} as const;}
 if(!active)return {ok:false,error:'push.inactiveAccount'} as const;
 try{
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {error}=await supabaseAdmin.from('push_subscriptions').upsert({user_id:context.userId,endpoint:data.endpoint,p256dh:data.keys.p256dh,auth:data.keys.auth},{onConflict:'endpoint'});
  if(error){console.error('[push-registration] save failed',error.code);return {ok:false,error:'push.saveFailed'} as const;}
  return {ok:true} as const;
 }catch{console.error('[push-registration] save unavailable');return {ok:false,error:'push.saveFailed'} as const;}
});