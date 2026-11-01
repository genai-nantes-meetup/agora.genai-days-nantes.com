import {useEffect,useState} from 'react';
import {useServerFn} from '@tanstack/react-start';
import {useQuery} from '@tanstack/react-query';
import {supabase} from '@/integrations/supabase/client';
import {useAuth} from '@/lib/auth';
import {useI18n} from '@/lib/i18n';
import {saveFeedback,saveFeedbackAnon} from '@/lib/phase4/feedback.functions';
import {feedbackKeys,feedbackOpen} from '@/lib/phase4/rules';
import {Button} from './ui/button';
import {Checkbox} from './ui/checkbox';
import {Textarea} from './ui/textarea';

const TOKEN_KEY='feedback-device';
function deviceToken(){
  let v=localStorage.getItem(TOKEN_KEY);
  if(!v){v=crypto.randomUUID();localStorage.setItem(TOKEN_KEY,v);}
  return v;
}

export function SessionFeedback({id,date,time}:{id:string;date:string;time:string}){
  const {t}=useI18n();
  const {user}=useAuth();
  const save=useServerFn(saveFeedback);
  const saveAnon=useServerFn(saveFeedbackAnon);
  const q=useQuery({
    queryKey:['feedback',id],
    queryFn:async()=>{
      const [counts,comments]=await Promise.all([
        supabase.rpc('feedback_counts',{sid:id}),
        supabase.rpc('feedback_comments',{sid:id}),
      ]);
      if(counts.error||comments.error)throw new Error('Unavailable');
      return {counts:counts.data,comments:comments.data};
    },
  });
  const [choices,setChoices]=useState<string[]>([]);
  const [comment,setComment]=useState('');
  const [busy,setBusy]=useState(false);
  const [failed,setFailed]=useState(false);
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const update=()=>setOpen(feedbackOpen(date,time,new Date()));
    update();
    const timer=setInterval(update,30000);
    return()=>clearInterval(timer);
  },[date,time]);
  useEffect(()=>{
    if(!user)return;
    const own=q.data?.comments.find(c=>c.user_id===user.id);
    if(own){setChoices(own.choices);setComment(own.comment);}
  },[q.data,user]);
  const counts=q.data?.counts;
  function count(key:string){return counts&&typeof counts==='object'&&!Array.isArray(counts)?Number(counts[key]??0):0;}
  const submit=(e:React.FormEvent)=>{
    e.preventDefault();
    setBusy(true);
    setFailed(false);
    const payload={session_id:id,choices:feedbackKeys.filter(k=>choices.includes(k)),comment};
    const req=user?save({data:payload}):saveAnon({data:{...payload,anon_token:deviceToken()}});
    void req.then(()=>q.refetch()).catch(()=>setFailed(true)).finally(()=>setBusy(false));
  };
  return(
    <section className="space-y-5 border-t pt-6">
      <h2 className="text-2xl">{t('feedback.title')}</h2>
      {q.isError?<p className="text-sm text-muted-foreground">{t('action.error')}</p>:<>
        <div className="grid gap-2 sm:grid-cols-2">
          {feedbackKeys.map(key=>(
            <label key={key} className="flex items-center gap-3 rounded-md border bg-card p-4 text-sm font-bold">
              <Checkbox disabled={!open||busy} checked={choices.includes(key)} onCheckedChange={v=>setChoices(old=>v?[...old,key]:old.filter(k=>k!==key))}/>
              <span className="flex-1">{t(`feedback.${key}`)}</span>
              <span className="font-label">{count(key)}</span>
            </label>
          ))}
        </div>
        {open?(
          <form className="space-y-3" onSubmit={submit}>
            <Textarea aria-label={t('feedback.comment')} placeholder={t('feedback.comment')} value={comment} maxLength={500} onChange={e=>setComment(e.target.value)}/>
            <p className="text-right text-xs text-muted-foreground">{comment.length}/500</p>
            <Button disabled={busy}>{t(busy?'loading':'form.save')}</Button>
          </form>
        ):<p className="text-sm text-muted-foreground">{t('feedback.closed')}</p>}
        {failed&&<p role="alert" className="text-sm text-destructive">{t('action.error')}</p>}
        <div className="divide-y">
          {q.data?.comments.filter(c=>!!c.comment).map(c=>(
            <article key={c.user_id??`${c.updated_at}-${c.comment.slice(0,20)}`} className="py-4">
              <p className="font-display text-xl font-bold">{c.first_name||c.last_name?`${c.first_name} ${c.last_name}`.trim():t('feedback.anonymous')}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm font-normal">{c.comment}</p>
            </article>
          ))}
        </div>
      </>}
    </section>
  );
}
