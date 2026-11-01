import {createServerFn} from '@tanstack/react-start';
import {setResponseHeader} from '@tanstack/react-start/server';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {feedbackInput,feedbackOpen} from './rules';

const anonInput=feedbackInput.extend({anon_token:z.string().uuid()});

async function assertOpen(sessionId:string){
  const r=await fetch('https://genai-days-nantes.com/api/fr/sessions.json',{cache:'no-store',signal:AbortSignal.timeout(4000)});
  if(!r.ok)throw new Error('Unavailable');
  const payload=z.object({event:z.object({date:z.string()}),sessions:z.array(z.object({id:z.string(),startTime:z.string()}))}).parse(await r.json());
  const s=payload.sessions.find(s=>s.id===sessionId);
  if(!s||!feedbackOpen(payload.event.date,s.startTime,new Date()))throw new Error('Not open');
}

export const saveFeedback=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(feedbackInput).handler(async({data,context})=>{
  setResponseHeader('Cache-Control','no-store');
  const {data:active}=await context.supabase.rpc('is_active_member',{uid:context.userId});
  if(!active)throw new Error('Forbidden');
  await assertOpen(data.session_id);
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const existing=await supabaseAdmin.from('session_feedback').select('id').eq('user_id',context.userId).eq('session_id',data.session_id).maybeSingle();
  const row={session_id:data.session_id,choices:data.choices,comment:data.comment,updated_at:new Date().toISOString()};
  const {error}=existing.data
    ?await supabaseAdmin.from('session_feedback').update(row).eq('id',existing.data.id)
    :await supabaseAdmin.from('session_feedback').insert({...row,user_id:context.userId});
  if(error)throw new Error('Unavailable');
  return {ok:true};
});

export const saveFeedbackAnon=createServerFn({method:'POST'}).inputValidator(anonInput).handler(async({data})=>{
  setResponseHeader('Cache-Control','no-store');
  await assertOpen(data.session_id);
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const existing=await supabaseAdmin.from('session_feedback').select('id').eq('anon_token',data.anon_token).eq('session_id',data.session_id).maybeSingle();
  const row={session_id:data.session_id,choices:data.choices,comment:data.comment,updated_at:new Date().toISOString()};
  const {error}=existing.data
    ?await supabaseAdmin.from('session_feedback').update(row).eq('id',existing.data.id)
    :await supabaseAdmin.from('session_feedback').insert({...row,anon_token:data.anon_token});
  if(error)throw new Error('Unavailable');
  return {ok:true};
});
