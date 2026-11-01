import {useEffect,useRef} from 'react';
import {useServerFn} from '@tanstack/react-start';
import {Textarea} from './ui/textarea';
import {useI18n} from '@/lib/i18n';
import {suggestTags} from '@/lib/phase4/ai.functions';
import {jobTags,type ProfileInput} from '@/lib/networking';
import {Choices} from './ProfileForm';
export function AiProfileFields({value,onChange,showTags=true}:{value:ProfileInput;onChange:(patch:Partial<ProfileInput>)=>void;showTags?:boolean}){const {t}=useI18n();const tags=useServerFn(suggestTags);const latest=useRef(value);latest.current=value;const proposed=useRef('');useEffect(()=>{const title=value.job_title?.trim();if(!showTags||!title||value.job_tags.length||proposed.current===title)return;const timer=setTimeout(()=>{proposed.current=title;void tags({data:{job_title:title}}).then(r=>{if(latest.current.job_title?.trim()===title&&!latest.current.job_tags.length&&r.tags.length)onChange({job_tags:r.tags});}).catch(()=>{});},900);return()=>clearTimeout(timer);},[value.job_title,value.job_tags.length,showTags,tags,onChange]);
 return <div className="space-y-5">{showTags&&<fieldset><legend className="mb-2 text-sm font-bold">{t('form.job_tags')}</legend><Choices values={jobTags} selected={value.job_tags} onChange={v=>onChange({job_tags:jobTags.filter(x=>v.includes(x))})} prefix="tag." cols={2}/></fieldset>}<label className="block space-y-2 text-sm font-bold">{t('form.pitch')}<Textarea className="ph-no-capture" value={value.pitch??''} maxLength={160} onChange={e=>onChange({pitch:e.target.value})}/><span className="block text-right text-xs text-muted-foreground">{value.pitch?.length??0}/160</span></label></div>;
}
