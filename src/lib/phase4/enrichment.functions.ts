import {createServerFn} from '@tanstack/react-start';
import {setResponseHeader} from '@tanstack/react-start/server';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {profileSchema,normalizeLinkedIn} from '../networking';
export const enrichLinkedIn=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({linkedin_url:profileSchema.shape.linkedin_url})).handler(async({data,context})=>{setResponseHeader('Cache-Control','no-store');const {data:s}=await context.supabase.from('profile_status').select('suspended').eq('user_id',context.userId).single();if(!s||s.suspended)throw new Error('Forbidden');const key=process.env['AIRSCALE_API_KEY'];if(!key)return {profile:null,success:false};const {enrich}=await import('./enrichment.server');return enrich(context.userId,`https://${normalizeLinkedIn(data.linkedin_url)}`,key);});
