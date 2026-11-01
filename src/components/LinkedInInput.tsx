import {useId} from 'react';
import {Input} from '@/components/ui/input';
import {useI18n} from '@/lib/i18n';
import {LINKEDIN_PREFIX,linkedInSuffix} from '@/lib/networking';
export function LinkedInInput({value,onChange,required=true,showLabel=true,showPrefix=true}:{value:string;onChange:(value:string)=>void;required?:boolean;showLabel?:boolean;showPrefix?:boolean}){
 const {t}=useI18n();const id=useId();
 return <div className="space-y-2 text-sm font-bold">{showLabel&&<label htmlFor={id}>{t('form.linkedin_url')}</label>}<div className="flex min-w-0 items-center rounded-md border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring">{showPrefix&&<span className="shrink-0 px-3 py-2 text-xs font-normal text-muted-foreground">{LINKEDIN_PREFIX}</span>}<Input id={id} className="min-w-24 flex-1 border-0 shadow-none focus-visible:ring-0" required={required} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder={showPrefix?undefined:t('form.linkedinHandle')} value={linkedInSuffix(value)} maxLength={260} onChange={e=>{const suffix=linkedInSuffix(e.target.value);onChange(suffix?LINKEDIN_PREFIX+suffix:'');}}/></div></div>;
}
