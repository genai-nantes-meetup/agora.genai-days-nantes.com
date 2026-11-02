import {z} from 'zod';
import {desiredSponsorDomains} from './sponsor-domains';

const schema=z.object({sponsors:z.array(z.object({id:z.string().min(1),tier:z.string(),website:z.string().nullish(),name:z.string().optional()}))});

/** Syncs auto rows of sponsor_domains from sponsors.json. Never touches manual rows; deletes nothing if the source fails. */
export async function syncSponsorDomains(){
  const r=await fetch('https://genai-days-nantes.com/api/fr/sponsors.json',{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error(`sponsors.json ${r.status}`);
  const payload=schema.parse(await r.json());
  if(payload.sponsors.length===0)throw new Error('sponsors.json empty');
  const desired=desiredSponsorDomains(payload.sponsors);
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {data:rows,error}=await supabaseAdmin.from('sponsor_domains').select('domain,sponsor_id,tier,source');
  if(error)throw error;
  const existing=new Map(rows.map(r=>[r.domain,r]));
  let upserted=0,deleted=0;
  for(const d of desired){
    const cur=existing.get(d.domain);
    if(cur?.source==='manual')continue;
    if(cur&&cur.sponsor_id===d.sponsor_id&&cur.tier===d.tier)continue;
    const {error:e}=await supabaseAdmin.from('sponsor_domains').upsert({...d,source:'auto'});if(e)throw e;upserted++;
  }
  const keep=new Set(desired.map(d=>d.domain));
  for(const row of rows){
    if(row.source!=='auto'||keep.has(row.domain))continue;
    const {error:e}=await supabaseAdmin.from('sponsor_domains').delete().eq('domain',row.domain).eq('source','auto');if(e)throw e;deleted++;
  }
  return {upserted,deleted,total:desired.length};
}
