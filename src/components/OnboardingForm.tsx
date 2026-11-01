import {useState,useRef} from 'react';
import {Link} from '@tanstack/react-router';
import {useServerFn} from '@tanstack/react-start';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {useI18n} from '@/lib/i18n';
import {emptyProfile,normalizeLinkedIn,profileSchema,intentions,type ProfileInput} from '@/lib/networking';
import {enrichLinkedIn} from '@/lib/phase4/enrichment.functions';
import {fillEmpty} from '@/lib/phase4/rules';
import {AiProfileFields} from './AiProfileFields';
import {Choices} from './ProfileForm';
import {LinkedInInput} from './LinkedInInput';

export function OnboardingForm({initial,busy,onSubmit}:{initial:Partial<ProfileInput>;busy:boolean;onSubmit:(profile:ProfileInput)=>Promise<void>}) {
 const {t,lang}=useI18n();
 const [value,setValue]=useState<ProfileInput>({...emptyProfile,...initial});
 const [step,setStep]=useState(0);
 const [consent,setConsent]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState(false);
 const prefill=useServerFn(enrichLinkedIn);
 const [avatar,setAvatar]=useState<string|null>(null);
 const pending=useRef<Promise<void>|null>(null);
 async function submit(){
  setError(false);
  if(step===0){
   if(!/^linkedin\.com\/in\/[^/]+$/.test(normalizeLinkedIn(value.linkedin_url))){setError(true);return;}
   setLoading(true);try{const result=await prefill({data:{linkedin_url:value.linkedin_url}});if(result.success&&result.profile&&typeof result.profile==='object'&&!Array.isArray(result.profile))setValue(old=>fillEmpty(old,result.profile as Partial<ProfileInput>));if(result.success)setAvatar(result.avatar??null);}catch{/* skip silently */}finally{setLoading(false);}
   setStep(1);
   return;
  }
  const parsed=profileSchema.safeParse({...value,lang,consent});
  if(!parsed.success){setError(true);return;}
  await onSubmit(parsed.data);
 }
 const field=(key:'linkedin_url'|'first_name'|'last_name'|'job_title'|'company'|'sector',required=false)=><label className="block space-y-2 text-sm font-bold" key={key}>{t(`form.${key}`)}<Input required={required} value={value[key]??''} maxLength={key==='linkedin_url'?300:160} autoComplete={key==='first_name'?'given-name':key==='last_name'?'family-name':key==='company'?'organization':key==='job_title'?'organization-title':'url'} onChange={e=>setValue(old=>({...old,[key]:e.target.value}))}/></label>;
 return <form className="space-y-6" onSubmit={e=>{e.preventDefault();void submit();}}>
  <div className="flex items-center justify-between font-label text-xs"><span>{t(step===0?'form.linkedin_url':'form.identity')}</span><span>{step+1}/2</span></div>
  {step===0?<LinkedInInput showLabel={false} showPrefix={false} value={value.linkedin_url} onChange={v=>setValue(old=>({...old,linkedin_url:v}))}/>:<div className="space-y-5">
   {avatar&&<img src={avatar} alt={t('form.photo')} className="size-24 rounded-md object-cover"/>}{field('first_name',true)}{field('last_name',true)}{field('job_title')}{field('company')}{field('sector')}<label className="block space-y-2 text-sm font-bold">{t('form.company_size')}<select className="h-10 w-full rounded-md border bg-card px-3" value={value.company_size??''} onChange={e=>setValue(old=>({...old,company_size:e.target.value as ProfileInput['company_size']||null}))}><option value="">{t('form.none')}</option>{(['tpe','pme','eti','grand_groupe'] as const).map(v=><option key={v} value={v}>{t(`size.${v}`)}</option>)}</select></label>
   <fieldset><legend className="mb-2 text-sm font-bold">{t('form.intentions')}</legend><Choices values={intentions} selected={value.intentions} onChange={v=>setValue(old=>({...old,intentions:intentions.filter(item=>v.includes(item))}))} prefix="intention."/></fieldset>
   <AiProfileFields value={value} onChange={patch=>setValue(old=>({...old,...patch}))}/>
   <div className="flex items-start gap-3"><Checkbox id="onboarding-consent" checked={consent} onCheckedChange={v=>setConsent(v===true)}/><div className="text-sm leading-relaxed"><label htmlFor="onboarding-consent">{t('form.consent')}</label>{' '}<Link to="/donnees" target="_blank" className="underline">{t('form.consentLink')}</Link></div></div>
  </div>}
  {error&&<p role="alert" className="text-sm text-destructive">{t('form.onboardingValidation')}</p>}
  <div className="flex gap-3">{step===1&&<Button type="button" variant="outline" disabled={busy||loading} onClick={()=>setStep(0)}>{t('form.previous')}</Button>}{step===0&&<Button type="button" variant="outline" disabled={busy||loading} onClick={()=>{pending.current=null;setLoading(false);setStep(1);}}>{t('form.skip')}</Button>}<Button type="submit" className="flex-1" disabled={busy||loading}>{t(busy||loading?'loading':step===0?'form.next':'form.finish')}</Button></div>
 </form>;
}