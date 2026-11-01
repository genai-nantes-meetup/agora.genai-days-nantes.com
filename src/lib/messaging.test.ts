import {describe,it,expect} from 'vitest';
import {pairKey,connectionState,messagingReadOnly,canModifyMessage,mergeMessages,isReaction,REACTIONS,pushSuppressed,selectDigests,conversationDigestDue,recipientDigestDue,validBody,type DigestCandidate} from './messaging';

const msg=(id:string,created_at:string,extra:Record<string,unknown>={})=>({id,created_at,edited_at:null as string|null,deleted_at:null as string|null,...extra});

describe('connection rules',()=>{
 it('uses the same unique pair regardless of direction',()=>{expect(pairKey('a','b')).toBe('a:b');expect(pairKey('b','a')).toBe('a:b');});
 it('keeps declines silent for the requester',()=>{expect(connectionState({requester_id:'a',status:'declined',cancelled_at:null},'a')).toBe('sent');expect(connectionState({requester_id:'a',status:'declined',cancelled_at:null},'b')).toBe('none');});
 it('blocks a cancelled pair even after acceptance',()=>{expect(connectionState({requester_id:'a',status:'accepted',cancelled_at:'2026-11-17T12:00:00Z'},'a')).toBe('blocked');});
});

describe('messaging rules',()=>{
 it('becomes read-only exactly at midnight Paris on 24 November 2026',()=>{expect(messagingReadOnly(new Date('2026-11-23T22:59:59.999Z'))).toBe(false);expect(messagingReadOnly(new Date('2026-11-23T23:00:00Z'))).toBe(true);});
 it('accepts 1 to 1600 characters',()=>{expect(validBody('  ')).toBe(false);expect(validBody('a'.repeat(1600))).toBe(true);expect(validBody('a'.repeat(1601))).toBe(false);});
 it('re-sending the same id never duplicates a message',()=>{const a=msg('1','2026-11-17T10:00:00Z');const list=mergeMessages(mergeMessages([],[a]),[a]);expect(list).toHaveLength(1);});
 it('a deletion received later replaces the original',()=>{const a=msg('1','2026-11-17T10:00:00Z',{body:'hi'});const d=msg('1','2026-11-17T10:00:00Z',{body:'',deleted_at:'2026-11-17T10:01:00Z'});expect(mergeMessages([d],[a])[0]!.deleted_at).toBe('2026-11-17T10:01:00Z');});
 it('own messages can be edited or deleted for 15 minutes only',()=>{const m={sender_id:'u',created_at:'2026-11-17T10:00:00Z',deleted_at:null};expect(canModifyMessage(m,'u',new Date('2026-11-17T10:14:59Z'))).toBe(true);expect(canModifyMessage(m,'u',new Date('2026-11-17T10:15:00Z'))).toBe(false);expect(canModifyMessage(m,'other',new Date('2026-11-17T10:01:00Z'))).toBe(false);});
 it('allows only the six fixed reactions',()=>{expect(REACTIONS).toEqual(['👍','❤️','😂','😮','🙏','🔥']);expect(isReaction('🔥')).toBe(true);expect(isReaction('💩')).toBe(false);});
 it('skips the push while the recipient has the conversation open (30 s)',()=>{const now=new Date('2026-11-17T10:00:30Z');expect(pushSuppressed('2026-11-17T10:00:01Z',now)).toBe(true);expect(pushSuppressed('2026-11-17T10:00:00Z',now)).toBe(false);expect(pushSuppressed(null,now)).toBe(false);});
});

describe('unread digest',()=>{
 const base:DigestCandidate={recipient_id:'r',conversation_id:'c',sender_id:'s',unread:2,oldest_unread_at:'2026-11-17T10:00:00Z',last_read_at:null,digested_at:null,last_digest_at:null};
 it('waits 30 minutes of unread before including a conversation',()=>{expect(conversationDigestDue(base,new Date('2026-11-17T10:29:59Z'))).toBe(false);expect(conversationDigestDue(base,new Date('2026-11-17T10:30:00Z'))).toBe(true);});
 it('sends at most one digest per recipient every 30 minutes',()=>{expect(recipientDigestDue('2026-11-17T10:00:00Z',new Date('2026-11-17T10:29:59Z'))).toBe(false);expect(recipientDigestDue('2026-11-17T10:00:00Z',new Date('2026-11-17T10:30:00Z'))).toBe(true);});
 it('includes a conversation again only after a read since the last digest',()=>{const now=new Date('2026-11-17T12:00:00Z');const digested={...base,digested_at:'2026-11-17T10:30:00Z',last_digest_at:'2026-11-17T10:30:00Z'};expect(conversationDigestDue(digested,now)).toBe(false);expect(conversationDigestDue({...digested,last_read_at:'2026-11-17T10:20:00Z'},now)).toBe(false);expect(conversationDigestDue({...digested,last_read_at:'2026-11-17T11:00:00Z'},now)).toBe(true);});
 it('groups due conversations by recipient and stops after closure',()=>{const rows=[base,{...base,conversation_id:'c2'},{...base,recipient_id:'r2',last_digest_at:'2026-11-17T10:50:00Z'}];const out=selectDigests(rows,new Date('2026-11-17T11:00:00Z'));expect(out.get('r')).toHaveLength(2);expect(out.has('r2')).toBe(false);expect(selectDigests(rows,new Date('2026-11-24T00:00:00+01:00')).size).toBe(0);});
});
