import {z} from 'zod';
import {jobTags,intentions,companySizes,aiLevels} from '../networking';
export const feedbackKeys=['actionable','learned','engaging','too_technical','too_theoretical','too_salesy'] as const;
export const feedbackInput=z.object({session_id:z.string().min(1).max(200),choices:z.array(z.enum(feedbackKeys)).max(6).transform(v=>[...new Set(v)]),comment:z.string().trim().max(500)});
export const filtersSchema=z.object({intentions:z.array(z.enum(intentions)).max(10),tags:z.array(z.enum(jobTags)).max(9),level:z.enum(aiLevels).nullable(),size:z.enum(companySizes).nullable(),sector:z.string().max(120).nullable(),status:z.enum(['speaker','sponsor','platinum','gold','silver']).nullable()});
export const tagsSchema=z.object({tags:z.array(z.enum(jobTags)).min(1).max(3)});
export const pitchSchema=z.object({pitch:z.string().trim().min(1).max(160)});
export const iceSchema=z.object({messages:z.array(z.string().trim().min(1).max(500)).length(2)});
export const inviteSchema=z.object({email:z.string().trim().email().max(254).transform(s=>s.toLowerCase()),first_name:z.string().trim().max(100).default(''),last_name:z.string().trim().max(100).default(''),billetweb_ref:z.string().trim().max(200).nullable().default(null)});
export function staffSize(n:number|null|undefined){return n==null||!Number.isInteger(n)||n<0?null:n<10?'tpe':n<250?'pme':n<5000?'eti':'grand_groupe';}
export const PURGE_START='2026-12-16T23:00:00.000Z';
export function purgeAllowed(now:Date,paused:boolean,preserved:number){return !paused&&preserved===2&&now.getTime()>=Date.parse(PURGE_START);}
export function feedbackOpen(date:string,time:string,now:Date){const match=/^(\d{2}):(\d{2})$/.exec(time);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!match)return false;const paris=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now).replace(' ','T');return paris>=`${date}T${time}`;}
export function fillEmpty<T extends object>(old:T,patch:Partial<T>):T{return {...old,...Object.fromEntries(Object.entries(patch).filter(([k,v])=>v!=null&&v!==''&&!(old as Record<string,unknown>)[k]))};}
