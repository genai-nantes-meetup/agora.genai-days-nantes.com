import {supabaseAdmin} from '@/integrations/supabase/client.server';
import {normalizeLinkedIn,emailDomain} from './networking';
import type {SpeakersPayload} from './event';
export async function recalculateStatus(uid:string,email:string,linkedin:string) {
 const {data:old,error}=await supabaseAdmin.from('profile_status').select('*').eq('user_id',uid).single(); if(error) throw error;
 const {data:domain,error:domainError}=await supabaseAdmin.from('sponsor_domains').select('*').eq('domain',emailDomain(email)).maybeSingle();if(domainError)throw domainError;
 let speakerFields={is_speaker:old.is_speaker,speaker_id:old.speaker_id};
 try {if(old.manual_override)throw new Error('Preserve override');const response=await fetch('https://genai-days-nantes.com/api/fr/speakers.json',{cache:'no-store',signal:AbortSignal.timeout(4000)});if(!response.ok)throw new Error('speaker source');const payload=await response.json() as SpeakersPayload;const speaker=findSpeakerProfile(linkedin,payload.speakers);speakerFields={is_speaker:!!speaker,speaker_id:speaker?.id??null};}catch { /* Retain known status when the official source is unavailable. */ }
 const {error:saveError}=await supabaseAdmin.from('profile_status').update({...speakerFields,sponsor_id:domain?.sponsor_id??null,sponsor_tier:domain?.tier??null}).eq('user_id',uid);if(saveError)throw saveError;
}