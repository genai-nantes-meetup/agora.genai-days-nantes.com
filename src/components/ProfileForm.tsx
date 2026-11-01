import {useState,useEffect,useRef} from 'react';
import {Link} from '@tanstack/react-router';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {useI18n,type TKey} from '@/lib/i18n';
import {emptyProfile,profileSchema,normalizeLinkedIn,jobTags,intentions,companySizes,aiLevels,type ProfileInput} from '@/lib/networking';
import {PhotoCrop} from './PhotoCrop';
import {LinkedInInput} from './LinkedInInput';
import {AiProfileFields} from './AiProfileFields';
import {createAutosave} from '@/lib/autosave';
export function Choices({values,selected,onChange,prefix}:{values:readonly string[];selected:string[];onChange:(values:string[])=>void;prefix:string}){const {t}=useI18n();return <div className="space-y-2">{values.map(v=><label key={v} className="flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 text-sm"><Checkbox checked={selected.includes(v)} onCheckedChange={checked=>onChange(checked?[...selected,v]:selected.filter(x=>x!==v))}/><span className="min-w-0">{t(`${prefix}${v}` as TKey)}</span></label>)}</div>;}
export function ProfileForm({initial,editing=false,busy,onSubmit,onAutoSave,avatar}:{initial?:Partial<ProfileInput>;editing?:boolean;busy:boolean;onSubmit:(value:ProfileInput,photo:Blob|null)=>Promise<void>;onAutoSave?:(value:ProfileInput,photo:Blob|null)=>Promise<void>;avatar?:string|null}){
 const {t,lang}=useI18n();const [value,setValue]=useState<ProfileInput>({...emptyProfile,...initial});const [step,setStep]=useState(0);const [consent,setConsent]=useState(editing);const [error,setError]=useState(false);const [photo,setPhoto]=useState<Blob|null>(null);const [preview,setPreview]=useState<string|null>(avatar??null);
 useEffect(()=>{if(!photo)return;const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
 const scheduler=useRef<ReturnType<typeof createAutosave>|null>(null);if(!scheduler.current)scheduler.current=createAutosave(()=>autoSaveRef.current());
 const savingRef=useRef(false);const lastPhotoRef=useRef<Blob|null>(null);const autoSaveRef=useRef<()=>void>(()=>{});
 useEffect(()=>{const s=scheduler.current;return()=>{s?.dispose();};},[]);
 autoSaveRef.current=()=>{if(!editing||!onAutoSave||busy)return;if(savingRef.current){scheduler.current?.changed();return;}const parsed=profileSchema.safeParse({...value,lang,consent:true});if(!parsed.success)return;const photoToSend=photo!==lastPhotoRef.current?photo:null;savingRef.current=true;void (async()=>{try{await onAutoSave(parsed.data,photoToSend);lastPhotoRef.current=photo;}catch{/* silent */}finally{savingRef.current=false;}})();};
 const set=(key:keyof ProfileInput,v:unknown)=>{setValue(old=>({...old,[key]:v}));scheduler.current?.changed();};
 const text=(key:'email'|'first_name'|'last_name'|'linkedin_url'|'job_title'|'company'|'sector',required=false)=><label key={key} className="block space-y-1.5 text-sm font-bold">{t(key==='email'?'auth.email':`form.${key}`)}{!required&&<span className="ml-2 text-xs font-normal text-muted-foreground">{t('form.optional')}</span>}<Input type={key==='email'?'email':'text'} autoComplete={key==='email'?'email':key==='first_name'?'given-name':key==='last_name'?'family-name':undefined} required={required} value={value[key]??''} maxLength={key==='linkedin_url'?300:160} onChange={e=>set(key,e.target.value)}/></label>;
 const select=(key:'company_size'|'ai_level',options:readonly string[],prefix:string)=><label className="block space-y-1.5 text-sm font-bold">{t(`form.${key}`)}<select className="h-10 w-full rounded-md border bg-card px-3 font-normal" value={value[key]??''} onChange={e=>set(key,e.target.value||null)}><option value="">{t('form.none')}</option>{options.map(x=><option key={x} value={x}>{t(`${prefix}${x}` as TKey)}</option>)}</select></label>;
 const patch=(p:Partial<ProfileInput>)=>{setValue(old=>({...old,...p}));scheduler.current?.changed();};
 async function submit(){setError(false);if(!editing){if(step===0&&(!value.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)||!value.first_name.trim()||!value.last_name.trim()||!/^linkedin\.com\/in\/[^/]+$/.test(normalizeLinkedIn(value.linkedin_url)))){setError(true);return;}if(step<2){setStep(step+1);window.scrollTo(0,0);return;}}const parsed=profileSchema.safeParse({...value,lang,consent});if(!parsed.success){setError(true);return;}await onSubmit(parsed.data,photo);scheduler.current?.settle();lastPhotoRef.current=photo;}
 const identity=<div className="space-y-5">{text('email',true)}{text('first_name',true)}{text('last_name',true)}<LinkedInInput value={value.linkedin_url} onChange={v=>set('linkedin_url',v)}/><PhotoCrop preview={preview} onChange={v=>{setPhoto(v);scheduler.current?.changed();}}/></div>;
 const activity=<div className="space-y-5">{text('job_title')}{text('company')}{select('company_size',companySizes,'size.')}{text('sector')}<AiProfileFields value={value} onChange={patch}/></div>;
 const goals=<div className="space-y-5"><fieldset><legend className="mb-2 text-sm font-bold">{t('form.intentions')}</legend><Choices values={intentions} selected={value.intentions} onChange={v=>set('intentions',v)} prefix="intention."/></fieldset>{select('ai_level',aiLevels,'level.')}<div className="flex items-start gap-3"><Checkbox id="consent" checked={consent} onCheckedChange={v=>{setConsent(v===true);scheduler.current?.changed();}}/><div className="text-sm leading-relaxed"><label htmlFor="consent">{t('form.consent')}</label>{' '}<Link to="/donnees" target="_blank" className="underline">{t('form.consentLink')}</Link></div></div></div>;
 const errorLine=error&&<p role="alert" className="text-sm text-destructive">{t('form.validation')}</p>;
 const blurProps={onBlur:(e:React.FocusEvent<HTMLFormElement>)=>{const rt=e.relatedTarget as HTMLElement|null;if(rt&&rt.closest('button'))return;scheduler.current?.focusLeft();}};
 if(editing)return <form className="space-y-8" {...blurProps} onSubmit={e=>{e.preventDefault();void submit();}}>
  <section className="space-y-5"><h2 className="font-label text-xs uppercase">{t('form.identity')}</h2>{identity}</section>
  <section className="space-y-5"><h2 className="font-label text-xs uppercase">{t('form.activity')}</h2>{activity}</section>
  <section className="space-y-5"><h2 className="font-label text-xs uppercase">{t('form.goals')}</h2>{goals}</section>
  {errorLine}
  <Button className="w-full" type="submit" disabled={busy}>{busy?t('loading'):t('form.save')}</Button>
 </form>;
 return <form className="space-y-6" {...blurProps} onSubmit={e=>{e.preventDefault();void submit();}}><div><div className="mb-2 flex justify-between font-label text-xs"><span>{t(['form.identity','form.activity','form.goals'][step] as TKey)}</span><span>{step+1}/3</span></div><div className="grid h-1 grid-cols-3 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step+1}>{[0,1,2].map(n=><span key={n} className={n<=step?'bg-accent':'bg-border'}/>)}</div></div>
 {step===0&&identity}
 {step===1&&activity}
 {step===2&&goals}
 {errorLine}<div className="flex gap-3">{step>0&&<Button variant="outline" type="button" disabled={busy} onClick={()=>{setStep(step-1);setError(false);}}>{t('form.previous')}</Button>}<Button className="flex-1" type="submit" disabled={busy}>{busy?t('loading'):t(step<2?'form.next':editing?'form.save':'form.finish')}</Button></div></form>;
}
