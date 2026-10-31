import { z } from 'zod';
export const jobTags = ['general_management','business_sales','marketing_communication','product_design','tech_data','hr_training','operations_finance','consulting_freelance','student_research'] as const;
export const intentions = ['recruit','find_job','find_clients','find_provider','partner','raise_funds','invest','find_cofounder','share_experience','meet_enthusiasts'] as const;
export const companySizes = ['tpe','pme','eti','grand_groupe'] as const;
export const aiLevels = ['debutant','praticien','expert'] as const;
export function normalizeLinkedIn(value: string) {
  try { const u = new URL(value.includes('://') ? value : `https://${value}`); if(u.hostname.toLowerCase().replace(/^www\./,'') !== 'linkedin.com') return ''; return `${u.hostname.toLowerCase().replace(/^www\./,'')}${u.pathname.toLowerCase().replace(/\/+$/,'')}`; } catch { return ''; }
}
export function emailDomain(email: string) { return email.trim().toLowerCase().split('@')[1] ?? ''; }
export const profileSchema = z.object({
  email:z.string().trim().email().max(254).transform(x=>x.toLowerCase()), first_name:z.string().trim().min(1).max(100),last_name:z.string().trim().min(1).max(100),
  linkedin_url:z.string().trim().max(300).refine(x=>/^linkedin\.com\/in\/[^/]+$/.test(normalizeLinkedIn(x))).transform(x=>`https://${normalizeLinkedIn(x)}`),
  job_title:z.string().trim().max(160).nullable(),company:z.string().trim().max(160).nullable(),company_size:z.enum(companySizes).nullable(),sector:z.string().trim().max(120).nullable(),
  job_tags:z.array(z.enum(jobTags)).max(9),intentions:z.array(z.enum(intentions)).min(1).max(10),pitch:z.string().max(160).nullable(),ai_level:z.enum(aiLevels).nullable(),lang:z.enum(['fr','en']),consent:z.literal(true)
});
export type ProfileInput = z.infer<typeof profileSchema>;
export type Status = {is_speaker:boolean;speaker_id:string|null;sponsor_id:string|null;sponsor_tier:string|null;suspended:boolean;manual_override:boolean;is_admin:boolean};
export type Member = Omit<ProfileInput,'consent'> & {user_id:string;photo_url:string|null;consent_at:string|null;profile_status:Status|null;avatar?:string|null};
export function profileComplete(profile: Partial<Member> | null | undefined) {
  return !!profile?.consent_at && profileSchema.safeParse({...emptyProfile,...profile,consent:true}).success;
}
export function sortDirectory<T extends {last_name:string;first_name:string;profile_status:{sponsor_tier:string|null}|null}>(rows:T[]) {
  const rank:Record<string,number>={platinum:0,gold:1,silver:2};
  return [...rows].sort((a,b)=>(rank[a.profile_status?.sponsor_tier??'']??3)-(rank[b.profile_status?.sponsor_tier??'']??3)||a.last_name.localeCompare(b.last_name,'fr',{sensitivity:'base'})||a.first_name.localeCompare(b.first_name,'fr',{sensitivity:'base'}));
}
export const emptyProfile:ProfileInput={email:'',first_name:'',last_name:'',linkedin_url:'',job_title:null,company:null,company_size:null,sector:null,job_tags:[],intentions:[],pitch:null,ai_level:null,lang:'fr',consent:true};