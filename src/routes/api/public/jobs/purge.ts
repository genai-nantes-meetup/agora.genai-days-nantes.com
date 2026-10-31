import {createFileRoute} from '@tanstack/react-router';
import {authenticateCronRequest} from '@/integrations/supabase/cron-auth';
export const Route=createFileRoute('/api/public/jobs/purge')({server:{handlers:{POST:async({request})=>{const denied=await authenticateCronRequest(request);if(denied)return denied;const {runPurge}=await import('@/lib/phase4/purge.server');return Response.json(await runPurge(),{headers:{'Cache-Control':'no-store'}});}}}});
