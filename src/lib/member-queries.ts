import {queryOptions} from '@tanstack/react-query';
import {supabase} from '@/integrations/supabase/client';
import type {Member} from './networking';
import {sortDirectory} from './networking';
async function withAvatars(rows:Member[]) {
 return Promise.all(rows.map(async row=>{if(!row.photo_url)return row;const {data}=await supabase.storage.from('avatars').createSignedUrl(row.photo_url,600);return {...row,avatar:data?.signedUrl??null};}));
}
export const membersOptions=()=>queryOptions({queryKey:['members'],queryFn:async()=>{const {data,error}=await supabase.from('profiles').select('*,profile_status(*)').not('consent_at','is',null);if(error)throw error;return withAvatars(sortDirectory(data as unknown as Member[]));},staleTime:15000});
export const myProfileOptions=(uid:string)=>queryOptions({queryKey:['my-profile',uid],queryFn:async()=>{const {data,error}=await supabase.from('profiles').select('*,profile_status(*)').eq('user_id',uid).single();if(error)throw error;return (await withAvatars([data as unknown as Member]))[0]??null;}});