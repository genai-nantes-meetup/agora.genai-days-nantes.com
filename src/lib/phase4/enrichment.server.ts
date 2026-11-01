import {z} from 'zod';
import {supabaseAdmin} from '@/integrations/supabase/client.server';
import {staffSize,parseAirscalePerson} from './rules';
export async function enrich(uid:string,url:string,key:string){
 const {data:cached}=await supabaseAdmin.from('enrichment_cache').select('result,success').eq('user_id',uid).eq('linkedin_url',url).maybeSingle();if(cached?.success)return {profile:cached.result,success:true};if(cached)await supabaseAdmin.from('enrichment_cache').delete().eq('user_id',uid).eq('linkedin_url',url).eq('success',false);
 const {data:reserved,error}=await supabaseAdmin.rpc('reserve_enrichment',{uid,url});if(error||!reserved)return {profile:null,success:false};
 const signal=AbortSignal.timeout(8000);
 const post=async(path:string,url:string)=>{const r=await fetch(`https://api.airscale.io/v1/${path}`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({linkedin_profile_url:url}),signal});if(!r.ok)throw new Error('Unavailable');return r.json();};
  try{const p=parseAirscalePerson(await post('profile',url));let total:number|null=null;let company=p.company;let sector=p.sector;
 if(p.company_url&&/^https:\/\/(www\.)?linkedin\.com\/company\//.test(p.company_url)){try{const c=z.object({name:z.string().max(160).optional(),staff:z.object({total:z.number().int().nonnegative().nullable()}).optional(),industries:z.array(z.string()).optional()}).parse(await post('company',p.company_url));total=c.staff?.total??null;company=c.name??company;sector=c.industries?.[0]?.slice(0,120)??sector;}catch{/* Person data remains usable. */}}
 const profile={first_name:p.first_name,last_name:p.last_name,job_title:p.job_title,company,city:p.city,company_size:staffSize(total),sector};
 if(p.picture){try{const u=new URL(p.picture);if(u.protocol==='https:'&&/^(media|media-exp\d|static-exp\d)\.licdn\.com$/.test(u.hostname)){const {data:existing}=await supabaseAdmin.from('profiles').select('photo_url').eq('user_id',uid).single();if(!existing?.photo_url){const r=await fetch(u,{signal,redirect:'error'});if(r.ok&&['image/jpeg','image/png','image/webp'].includes(r.headers.get('content-type')?.split(';')[0]??'')){const bytes=await r.arrayBuffer();if(bytes.byteLength<=5*1024*1024){const path=`${uid}/avatar.jpg`;const {error}=await supabaseAdmin.storage.from('avatars').upload(path,bytes,{contentType:r.headers.get('content-type')??'image/jpeg',upsert:true});if(!error)await supabaseAdmin.from('profiles').update({photo_url:path}).eq('user_id',uid).is('photo_url',null);}}}}}catch{/* A photo failure never blocks onboarding. */}}
 const {error:save}=await supabaseAdmin.from('enrichment_cache').update({result:profile,success:true}).eq('user_id',uid).eq('linkedin_url',url);return save?{profile:null,success:false}:{profile,success:true};
 }catch{return {profile:null,success:false};}
}
