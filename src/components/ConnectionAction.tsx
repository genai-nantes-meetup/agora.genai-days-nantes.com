import {Link,useNavigate} from '@tanstack/react-router';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {useState} from 'react';
import {UserPlus,Check,MessageCircle,X,Clock} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from './ui/button';
import {useAuth} from '@/lib/auth';
import {useI18n} from '@/lib/i18n';
import {inboxOptions} from '@/lib/messaging-client';
import {sendConnection,acceptConnection,declineConnection} from '@/lib/messaging.functions';
import {connectionState} from '@/lib/messaging';
export function ConnectionAction({target}:{target:string}){
 const {user}=useAuth();const {t}=useI18n();const qc=useQueryClient();const navigate=useNavigate();const q=useQuery({...inboxOptions(user?.id??''),enabled:!!user});const send=useServerFn(sendConnection);const accept=useServerFn(acceptConnection);const decline=useServerFn(declineConnection);const [busy,setBusy]=useState(false);
 if(!user||user.id===target)return null;
 const request=q.data?.requests.find(r=>[r.requester_id,r.recipient_id].includes(target));const state=connectionState(request,user.id);const conversation=q.data?.conversations.find(c=>c.request_id===request?.id);
 async function act(kind:'send'|'accept'|'decline'){setBusy(true);try{if(kind==='send')await send({data:{id:target}});else if(request){if(kind==='accept'){const c=await accept({data:{id:request.id}});await qc.invalidateQueries({queryKey:['inbox']});await navigate({to:'/messages/$id',params:{id:c.id}});}else await decline({data:{id:request.id}});}await qc.invalidateQueries({queryKey:['inbox']});}catch{toast.error(t('action.error'));}finally{setBusy(false);}}
 if(state==='connected'&&conversation)return <Button asChild className="w-full"><Link to="/messages/$id" params={{id:conversation.id}}><MessageCircle className="size-4"/>{t('connection.message')}</Link></Button>;
 if(state==='received')return <div className="flex gap-2"><Button disabled={busy} className="flex-1" onClick={()=>void act('accept')}><Check className="size-4"/>{t('connection.accept')}</Button><Button variant="outline" disabled={busy} onClick={()=>void act('decline')}><X className="size-4"/>{t('connection.decline')}</Button></div>;
 return <Button className="w-full" disabled={busy||q.isPending||state!=='none'} onClick={()=>void act('send')}>{state==='sent'?<Clock className="size-4"/>:<UserPlus className="size-4"/>}{t(state==='sent'?'connection.sent':state==='blocked'?'connection.blocked':'directory.connect')}</Button>;
}