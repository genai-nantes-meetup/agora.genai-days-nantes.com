import {track} from '@/lib/analytics';
import {useEffect,useState} from 'react';
import {useNavigate} from '@tanstack/react-router';
import {useServerFn} from '@tanstack/react-start';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useI18n} from '@/lib/i18n';
import {requestMagicLink} from '@/lib/members.functions';
import {useAuth} from '@/lib/auth';
export function EmailSignIn(){
 const {t}=useI18n();const [email,setEmail]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState<'auth.sent'|'action.error'|null>(null);const send=useServerFn(requestMagicLink);const navigate=useNavigate();const {user}=useAuth();
 useEffect(()=>{if(user)void navigate({to:'/networking',replace:true});},[user,navigate]);
 useEffect(()=>{const search=new URLSearchParams(window.location.search);const hash=new URLSearchParams(window.location.hash.slice(1));if(search.get('error')||hash.get('error'))setMessage('action.error');},[]);
 return <section className="px-5 py-10"><p className="font-label text-xs text-muted-foreground">17.11.2026 · Nantes</p><h1 className="mt-2 text-page">{t('auth.title')}</h1><p className="mt-3 text-muted-foreground">{t('auth.body')}</p><form className="mt-8 space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage(null);try{await send({data:{email,origin:window.location.origin}});setMessage('auth.sent');track('magic_link_requested');}catch{setMessage('action.error');}finally{setBusy(false);}}}><label className="block space-y-2 text-sm font-bold">{t('auth.email')}<Input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><Button className="w-full" disabled={busy}>{t(busy?'loading':'auth.send')}</Button>{message&&<p role="status" className="text-sm">{t(message)}</p>}</form></section>;
}