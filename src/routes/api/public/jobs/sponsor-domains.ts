import {createFileRoute} from '@tanstack/react-router';
import {authenticateCronRequest} from '@/integrations/supabase/cron-auth';
export const Route=createFileRoute('/api/public/jobs/sponsor-domains')({server:{handlers:{POST:async({request})=>{
 const denied=await authenticateCronRequest(request);if(denied)return denied;
 const {syncSponsorDomains}=await import('@/lib/sponsor-domains-sync.server');
 try{return Response.json(await syncSponsorDomains(),{headers:{'Cache-Control':'no-store'}});}
 catch(e){console.error('Sponsor domain sync failed',e);return Response.json({ok:false},{status:502,headers:{'Cache-Control':'no-store'}});}
}}}});
