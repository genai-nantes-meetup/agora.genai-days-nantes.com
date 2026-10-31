import {createFileRoute} from '@tanstack/react-router';
import {z} from 'zod';
export const Route=createFileRoute('/api/public/twilio/pre')({server:{handlers:{POST:async({request})=>{
 const raw=await request.text();if(raw.length>16000)return new Response(null,{status:413});const {verifyTwilioRequest,canSendTwilio}=await import('@/lib/twilio.server');if(!await verifyTwilioRequest(request,raw))return new Response(null,{status:401});
 const fields=Object.fromEntries(new URLSearchParams(raw));const p=z.object({EventType:z.string(),ConversationSid:z.string().regex(/^CH[a-fA-F0-9]{32}$/),Author:z.string().uuid(),Body:z.string().trim().min(1).max(1600)}).safeParse(fields);
 if(!p.success||p.data.EventType!=='onMessageAdd')return new Response(null,{status:403});
 try{return new Response(null,{status:await canSendTwilio(p.data.ConversationSid,p.data.Author)?200:403});}catch{return new Response(null,{status:503});}
}}}});