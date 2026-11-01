import {track} from '@/lib/analytics';
import {identifyCurrentUser} from './Analytics';
import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {toast} from 'sonner';
import {supabase} from '@/integrations/supabase/client';
import {saveProfile} from '@/lib/members.functions';
import {useI18n} from '@/lib/i18n';
import type {Member} from '@/lib/networking';
import {OnboardingForm} from './OnboardingForm';
export function AccountOnboarding({profile}:{profile:Member}){
 const {t}=useI18n();const [busy,setBusy]=useState(false);const save=useServerFn(saveProfile);const client=useQueryClient();
 return <section className="space-y-6 px-5 py-6"><h1 className="text-3xl">{t('profile.title')}</h1><OnboardingForm initial={profile} initialAvatar={profile.avatar??null} busy={busy} onSubmit={async(value,photo)=>{setBusy(true);try{if(photo){const path=`${profile.user_id}/avatar.jpg`;const {error}=await supabase.storage.from('avatars').upload(path,photo,{upsert:true,contentType:'image/jpeg'});if(error)throw error;const {error:e2}=await supabase.from('profiles').update({photo_url:path}).eq('user_id',profile.user_id);if(e2)throw e2;track('profile_photo_uploaded');}await save({data:value});track('onboarding_step_completed',{step:2});track('onboarding_completed');void identifyCurrentUser(profile.user_id);await client.invalidateQueries({queryKey:['my-profile',profile.user_id]});await client.invalidateQueries({queryKey:['members']});}catch{toast.error(t('action.error'));}finally{setBusy(false);}}}/></section>;
}