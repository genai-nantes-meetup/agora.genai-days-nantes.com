import {track} from '@/lib/analytics';
import {useEffect,useState} from 'react';
import {useServerFn} from '@tanstack/react-start';
import {Bell} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from './ui/button';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';
import {useAuth} from '@/lib/auth';
import {useI18n} from '@/lib/i18n';
import {pushConfiguration,subscribePush} from '@/lib/push.functions';
import {activePushRegistration,pushErrorKey,type PushActivationStage} from '@/lib/push-registration';
export function PushInvitation({showTrigger=false}:{showTrigger?:boolean}){const {user}=useAuth();const {t}=useI18n();const [open,setOpen]=useState(false);const [ios,setIos]=useState(false);const [busy,setBusy]=useState(false);const [enabled,setEnabled]=useState(false);const [availability,setAvailability]=useState<'supported'|'denied'|'unsupported'>('unsupported');const config=useServerFn(pushConfiguration);const subscribe=useServerFn(subscribePush);
 useEffect(()=>{setIos(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!matchMedia('(display-mode: standalone)').matches);if(!user||!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))return;setAvailability(Notification.permission==='denied'?'denied':'supported');const key=`hey-genai:push-asked:${user.id}`;try{if(localStorage.getItem(key)||Notification.permission!=='default')return;setOpen(true);track('push_prompt_shown');localStorage.setItem(key,'1');}catch{}},[user?.id]);
 async function enable(){setBusy(true);let stage:PushActivationStage='permission';try{
  // Keep the permission request inside the click gesture, before any network await.
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  track('push_permission_result',{result:permission==='default'?'dismissed':permission});
  if(permission!=='granted'){if(permission==='denied'){setAvailability('denied');toast.error(t('push.denied'));}return;}
  stage='configuration';const {publicKey}=await config();if(!publicKey){toast.error(t('push.unavailable'));return;}
  stage='worker';
  const registration=await activePushRegistration(await navigator.serviceWorker.register('/notifications/worker.js',{scope:'/notifications/'}));
  stage='subscription';let subscription=await registration.pushManager.getSubscription();
  if(!subscription){const bytes=Uint8Array.from(atob(publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});}
  const json=subscription.toJSON();if(!json.endpoint||!json.keys?.['p256dh']||!json.keys['auth'])throw new Error('Unavailable');
  stage='save';await subscribe({data:{endpoint:json.endpoint,keys:{p256dh:json.keys['p256dh'],auth:json.keys['auth']}}});setEnabled(true);setOpen(false);
 }catch(error){const key=pushErrorKey(error,stage);if(key==='push.denied')setAvailability('denied');toast.error(t(key));}finally{setBusy(false);}}
 return <>{showTrigger&&user&&<div className="flex justify-end px-5 pt-3"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground" disabled={busy||enabled} onClick={()=>{setOpen(true);track('push_prompt_shown');}}><Bell className="size-3.5"/>{t(enabled?'push.enabled':'push.activate')}</Button></div>}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle className="flex items-center gap-2"><Bell className="size-5"/>{t('push.title')}</DialogTitle><DialogDescription>{t(ios?'push.ios':availability==='denied'?'push.denied':availability==='unsupported'?'push.unavailable':'push.body')}</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setOpen(false)}>{t('push.later')}</Button>{!ios&&availability==='supported'&&<Button disabled={busy} onClick={()=>void enable()}>{t('push.enable')}</Button>}</div></DialogContent></Dialog></>;
}