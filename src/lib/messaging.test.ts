import {describe,it,expect} from 'vitest';
import {pairKey,connectionState,messagingReadOnly,reminderDue} from './messaging';
describe('phase 3 rules',()=>{
 it('uses the same unique pair regardless of direction',()=>{expect(pairKey('a','b')).toBe('a:b');expect(pairKey('b','a')).toBe('a:b');});
 it('keeps declines silent for the requester',()=>{expect(connectionState({requester_id:'a',status:'declined',cancelled_at:null},'a')).toBe('sent');expect(connectionState({requester_id:'a',status:'declined',cancelled_at:null},'b')).toBe('none');});
 it('blocks a cancelled pair even after acceptance',()=>{expect(connectionState({requester_id:'a',status:'accepted',cancelled_at:'2026-11-17T12:00:00Z'},'a')).toBe('blocked');});
 it('closes exactly at midnight Paris on November 24',()=>{expect(messagingReadOnly(new Date('2026-11-23T22:59:59.999Z'))).toBe(false);expect(messagingReadOnly(new Date('2026-11-23T23:00:00Z'))).toBe(true);});
 it('waits five minutes for the first reminder',()=>{const v={messageIndex:2,readIndex:1,lastReminderIndex:null,createdAt:'2026-11-17T12:00:00Z'};expect(reminderDue(v,new Date('2026-11-17T12:04:59Z'))).toBe(false);expect(reminderDue(v,new Date('2026-11-17T12:05:00Z'))).toBe(true);});
 it('sends at most one reminder until the prior message is read',()=>{const v={messageIndex:4,readIndex:1,lastReminderIndex:2,createdAt:'2026-11-17T12:00:00Z'};expect(reminderDue(v,new Date('2026-11-17T12:10:00Z'))).toBe(false);expect(reminderDue({...v,readIndex:2},new Date('2026-11-17T12:10:00Z'))).toBe(true);expect(reminderDue({...v,readIndex:4},new Date('2026-11-17T12:10:00Z'))).toBe(false);});
});