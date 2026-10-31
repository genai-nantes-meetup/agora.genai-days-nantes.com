export const MESSAGING_CLOSES_AT = '2026-11-24T00:00:00+01:00';
export function messagingReadOnly(now = new Date()): boolean {
  return now.getTime() >= Date.parse(MESSAGING_CLOSES_AT);
}
export function pairKey(a: string, b: string): string { return [a, b].sort().join(':'); }
export type ConnectionState = 'none' | 'sent' | 'received' | 'connected' | 'blocked';
export function connectionState(request: {requester_id:string;status:string;cancelled_at:string|null}|undefined, uid:string):ConnectionState {
  if (!request) return 'none';
  if (request.cancelled_at) return 'blocked';
  if (request.status === 'accepted') return 'connected';
  if (request.requester_id === uid) return 'sent';
  return request.status === 'pending' ? 'received' : 'none';
}
export function reminderDue(input:{messageIndex:number;readIndex:number;lastReminderIndex:number|null;createdAt:string}, now=new Date()):boolean {
  return input.messageIndex > input.readIndex && now.getTime()-Date.parse(input.createdAt)>=300000 && (input.lastReminderIndex===null || input.readIndex>=input.lastReminderIndex);
}