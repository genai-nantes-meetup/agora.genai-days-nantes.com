import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {toast} from 'sonner';
import {saveProfile} from '@/lib/members.functions';
import {useI18n} from '@/lib/i18n';
import type {Member} from '@/lib/networking';
import {OnboardingForm} from './OnboardingForm';
export function AccountOnboarding({profile}:{profile:Member}){
 const {t}=useI18n();const [busy,setBusy]=useState(false);const save=useServerFn(saveProfile);const client=useQueryClient();
 return <section className="space-y-6 px-5 py-6"><h1 className="text-3xl">{t('profile.title')}</h1><OnboardingForm initial={profile} busy={busy} onSubmit={async value=>{setBusy(true);try{await save({data:value});await client.invalidateQueries({queryKey:['my-profile',profile.user_id]});await client.invalidateQueries({queryKey:['members']});}catch{toast.error(t('action.error'));}finally{setBusy(false);}}}/></section>;
}