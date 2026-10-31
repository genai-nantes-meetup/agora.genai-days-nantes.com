import {useState} from 'react';
import {Link} from '@tanstack/react-router';
import {useServerFn} from '@tanstack/react-start';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {useI18n} from '@/lib/i18n';
import {emptyProfile,normalizeLinkedIn,profileSchema,intentions,type ProfileInput} from '@/lib/networking';
import {prefillLinkedIn} from '@/lib/members.functions';
import {Choices} from './ProfileForm';

export function OnboardingForm({initial,busy,onSubmit}:{initial:Partial<ProfileInput>;busy:boolean;onSubmit:(profile:ProfileInput)=>Promise<void>}) {
 const {t,lang}=useI18n();
 const [value,setValue]=useState<ProfileInput>({...emptyProfile,...initial});
 const [step,setStep]=useState(0);
 const [consent,setConsent]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState(false);
 const prefill=useServerFn(prefillLinkedIn);
 async function submit(){
  setError(false);
  if(step===0){
   if(!/^linkedin\.com\/in\/[^/]+$/.test(normalizeLinkedIn(value.linkedin_url))){setError(true);return;}
   setLoading(true);
   try{const result=await prefill({data:{linkedin_url:value.linkedin_url,lang}});if(result.profile)setValue(old=>({...old,...Object.fromEntries(Object.entries(result.profile).filter(([key,v])=>v&&!old[key as keyof ProfileInput]))}));}
   catch{/* Manual entry remains available when the source is unavailable. */}
   finally{setLoading(false);setStep(1);}
   return;
  }
  const parsed=profileSchema.safeParse({...value,lang,consent});
  if(!parsed.success){setError(true);return;}
  await onSubmit(parsed.data);
 }
 const field=(key:'linkedin_url'|'first_name'|'last_name'|'job_title'|'company',required=false)=><label className="block space-y-2 text-sm font-bold" key={key}>{t(`form.${key}`)}<Input required={required} value={value[key]??''} maxLength={key==='linkedin_url'?300:160} autoComplete={key==='first_name'?'given-name':key==='last_name'?'family-name':key==='company'?'organization':key==='job_title'?'organization-title':'url'} onChange={e=>setValue(old=>({...old,[key]:e.target.value}))}/></label>;
 return <form className="space-y-6" onSubmit={e=>{e.preventDefault();void submit();}}>
  <div className="flex items-center justify-between font-label text-xs"><span>{t(step===0?'form.linkedin_url':'form.identity')}</span><span>{step+1}/2</span></div>
  {step===0?field('linkedin_url',true):<div className="space-y-5">
   {field('first_name',true)}{field('last_name',true)}{field('job_title')}{field('company')}
   <fieldset><legend className="mb-2 text-sm font-bold">{t('form.intentions')}</legend><Choices values={intentions} selected={value.intentions} onChange={v=>setValue(old=>({...old,intentions:v}))} prefix="intention."/></fieldset>
   <div className="flex items-start gap-3"><Checkbox id="onboarding-consent" checked={consent} onCheckedChange={v=>setConsent(v===true)}/><div className="text-sm leading-relaxed"><label htmlFor="onboarding-consent">{t('form.consent')}</label>{' '}<Link to="/donnees" target="_blank" className="underline">{t('form.consentLink')}</Link></div></div>
  </div>}
  {error&&<p role="alert" className="text-sm text-destructive">{t('form.onboardingValidation')}</p>}
  <div className="flex gap-3">{step===1&&<Button type="button" variant="outline" disabled={busy||loading} onClick={()=>setStep(0)}>{t('form.previous')}</Button>}<Button type="submit" className="flex-1" disabled={busy||loading}>{t(busy||loading?'loading':step===0?'form.next':'form.finish')}</Button></div>
 </form>;
}