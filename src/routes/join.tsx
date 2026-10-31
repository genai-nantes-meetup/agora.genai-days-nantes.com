import {createFileRoute,Link,useNavigate} from '@tanstack/react-router';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {toast} from 'sonner';
import {useI18n} from '@/lib/i18n';
import {checkInvitation,redeemInvitation} from '@/lib/members.functions';
import {ProfileForm} from '@/components/ProfileForm';
import {LoadingView} from '@/components/common';
import {supabase} from '@/integrations/supabase/client';
export const Route=createFileRoute('/join')({validateSearch:(search:Record<string,unknown>)=>({token:typeof search['token']==='string'?search['token']:''}),head:()=>({meta:[{title:'Inscription · Hey GenAI Days'},{name:'description',content:'Créez votre profil pour GenAI Days 2026.'},{property:'og:title',content:'Inscription · Hey GenAI Days'},{property:'og:description',content:'Inscription sur invitation pour rencontrer les participant·es.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'referrer',content:'no-referrer'}]}),component:Join});
function Join(){const {token}=Route.useSearch();const {t}=useI18n();const verify=useServerFn(checkInvitation);const redeem=useServerFn(redeemInvitation);const [busy,setBusy]=useState(false);const navigate=useNavigate();const q=useQuery({queryKey:['invitation',token],queryFn:()=>verify({data:{token}}),retry:false});if(q.isPending)return <LoadingView/>;if(!q.data?.valid)return <section className="space-y-5 p-6"><h1 className="text-3xl">{t('auth.invalid')}</h1><Link className="underline" to="/login">{t('auth.login')}</Link></section>;
 return <section className="space-y-6 px-5 py-6"><h1 className="text-3xl">{t('profile.title')}</h1><ProfileForm initial={{email:q.data.email??''}} busy={busy} onSubmit={async(profile,photo)=>{setBusy(true);try{const result=await redeem({data:{token,profile}});const {data,error}=await supabase.auth.verifyOtp({token_hash:result.token_hash,type:'magiclink'});if(error||!data.user)throw error??new Error('session');if(photo){const path=`${data.user.id}/avatar.jpg`;const {error:uploadError}=await supabase.storage.from('avatars').upload(path,photo,{contentType:'image/jpeg',upsert:true});if(uploadError)toast.error(t('photo.error'));else await supabase.from('profiles').update({photo_url:path}).eq('user_id',data.user.id);}await navigate({to:'/networking'});}catch{toast.error(t('action.error'));}finally{setBusy(false);}}}/></section>;
}