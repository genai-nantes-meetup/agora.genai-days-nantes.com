import {SignJWT} from 'jose';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {messagingReadOnly} from './messaging';
export const APP_ORIGIN='https://hey.genai-days-nantes.com';
export function twilioConfig(){
 const account=process.env['TWILIO_ACCOUNT_SID'];const key=process.env['TWILIO_API_KEY_SID'];const secret=process.env['TWILIO_API_KEY_SECRET'];const service=process.env['TWILIO_CONVERSATIONS_SERVICE_SID'];
 if(!account||!key||!secret||!service)throw new Error('TwilioNotConfigured');
 return {account,key,secret,service};
}
export async function twilio<T>(path:string,body?:Record<string,string>):Promise<T>{
 const c=twilioConfig();const response=await fetch(`https://conversations.twilio.com/v1/Services/${c.service}${path}`,{method:body?'POST':'GET',headers:{Authorization:`Basic ${btoa(`${c.key}:${c.secret}`)}`,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:body?new URLSearchParams(body):undefined,signal:AbortSignal.timeout(4000)});
 if(!response.ok){const text=await response.text();let code:string|number='unknown';try{code=JSON.parse(text).code??'unknown';}catch{}console.error('Twilio request failed',response.status,code);throw new Error(`Twilio request failed [${response.status}] code ${code}`);}
 return response.json() as Promise<T>;
}
export async function issueTwilioToken(uid:string){
 const c=twilioConfig();const now=Math.floor(Date.now()/1000);
 return new SignJWT({grants:{identity:uid,chat:{service_sid:c.service}}}).setProtectedHeader({alg:'HS256',typ:'JWT',cty:'twilio-fpa;v=1'}).setIssuer(c.key).setSubject(c.account).setJti(`${c.key}-${crypto.randomUUID()}`).setIssuedAt(now).setExpirationTime(now+600).sign(new TextEncoder().encode(c.secret));
}
export async function verifyTwilioRequest(request:Request,raw:string):Promise<boolean>{
 const secret=process.env['TWILIO_AUTH_TOKEN'];const signature=request.headers.get('x-twilio-signature');if(!secret||!signature)return false;
 const url=new URL(request.url);const canonical=`${APP_ORIGIN}${url.pathname}${url.search}`;
 if(!request.headers.get('content-type')?.includes('application/x-www-form-urlencoded'))return false;
 const fields=new URLSearchParams(raw);let signed=canonical;
 for(const name of [...new Set(fields.keys())].sort())for(const value of [...new Set(fields.getAll(name))].sort())signed+=name+value;
 const expected=createHmac('sha1',secret).update(signed).digest();let actual:Buffer;try{actual=Buffer.from(signature,'base64');}catch{return false;}return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
type TwilioConversation={sid:string;state:string};
type Participant={sid:string;identity:string;last_read_message_index:number|null};
export async function provisionConversation(requestId:string,a:string,b:string){
 const unique=`genai-${requestId}`;
 let conversation:TwilioConversation;
 try{conversation=await twilio<TwilioConversation>(`/Conversations/${unique}`);}catch(error){if(!(error instanceof Error)||!error.message.includes('[404]'))throw error;conversation=await twilio<TwilioConversation>('/Conversations',{UniqueName:unique,State:'active'});}
 const participants=await twilio<{participants:Participant[]}>(`/Conversations/${conversation.sid}/Participants`);
 const add=async(identity:string)=>participants.participants.find(p=>p.identity===identity)?.sid??(await twilio<Participant>(`/Conversations/${conversation.sid}/Participants`,{Identity:identity})).sid;
 const pa=await add(a);const pb=await add(b);return {sid:conversation.sid,pa,pb};
}
export async function closeTwilioConversation(sid:string){await twilio(`/Conversations/${sid}`,{State:'closed'});}
export async function readHorizon(sid:string,participant:string){return (await twilio<Participant>(`/Conversations/${sid}/Participants/${participant}`)).last_read_message_index??-1;}
export async function canSendTwilio(sid:string,author:string){
 if(messagingReadOnly())return false;
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data:c,error}=await supabaseAdmin.from('conversations').select('*').eq('conversation_sid',sid).maybeSingle();if(error||!c||c.closed_at||![c.user_a,c.user_b].includes(author))return false;
 const {data:status,error:se}=await supabaseAdmin.from('profile_status').select('suspended').in('user_id',[c.user_a,c.user_b]);
 const {data:blocks,error:be}=await supabaseAdmin.from('blocks').select('blocker_id').or(`and(blocker_id.eq.${c.user_a},blocked_id.eq.${c.user_b}),and(blocker_id.eq.${c.user_b},blocked_id.eq.${c.user_a})`);
 return !se&&!be&&status?.length===2&&status.every(s=>!s.suspended)&&blocks?.length===0;
}