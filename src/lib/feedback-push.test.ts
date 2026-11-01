import {describe,it,expect} from 'vitest';
import {feedbackPushDue,type Session} from './event';
const s=(id:string,format:string|null,startTime='10:00',durationMinutes=30):Session=>({id,title:id,format,track:'tech',startTime,durationMinutes,room:null});
const list=[s('talk','talk'),s('rt','table-ronde'),s('contest','concours'),s('key','keynote'),s('pod','podcast'),s('meal',null)];
describe('feedback push',()=>{
 it('fires 5 minutes after the end, never for keynotes, meals or podcast',()=>{expect(feedbackPushDue(list,'2026-11-17','2026-11-17','10:35').map(x=>x.id)).toEqual(['talk','rt','contest']);});
 it('not before end + 5 minutes',()=>{expect(feedbackPushDue(list,'2026-11-17','2026-11-17','10:34')).toEqual([]);});
 it('only on the event day',()=>{expect(feedbackPushDue(list,'2026-11-17','2026-11-18','10:35')).toEqual([]);});
 it('stops after the catch-up window',()=>{expect(feedbackPushDue(list,'2026-11-17','2026-11-17','11:05')).toEqual([]);});
});
