import {createFileRoute} from '@tanstack/react-router';
import {authenticateCronRequest} from '@/integrations/supabase/cron-auth';
export const Route=createFileRoute('/api/public/jobs/messaging')({server:{handlers:{POST:async({request})=>{
 const denied=await authenticateCronRequest(request);if(denied)return denied;
 const {runUnreadDigests}=await import('@/lib/app-emails.server');const digests=await runUnreadDigests().catch(e=>{console.error('Digest run failed',e);return {sent:0,skipped:0};});
 return Response.json({digests},{headers:{'Cache-Control':'no-store'}});
}}}});
