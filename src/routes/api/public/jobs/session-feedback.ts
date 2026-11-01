import {createFileRoute} from '@tanstack/react-router';
import {authenticateCronRequest} from '@/integrations/supabase/cron-auth';
export const Route=createFileRoute('/api/public/jobs/session-feedback')({server:{handlers:{POST:async({request})=>{
 const denied=await authenticateCronRequest(request);if(denied)return denied;
 const {runSessionFeedbackPushes}=await import('@/lib/session-feedback-push.server');
 const result=await runSessionFeedbackPushes().catch(e=>{console.error('Session feedback push failed',e);return {sent:[] as string[]};});
 return Response.json(result,{headers:{'Cache-Control':'no-store'}});
}}}});
