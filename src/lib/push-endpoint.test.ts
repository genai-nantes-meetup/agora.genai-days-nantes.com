import {describe,expect,it} from 'vitest';
import {validPushEndpoint} from './notifications.server';

describe('validPushEndpoint',()=>{
  it('accepts the rotating Chrome FCM jmt hosts',()=>{
    expect(validPushEndpoint('https://jmt17.google.com/fcm/send/abc')).toBe(true);
    expect(validPushEndpoint('https://jmt01.google.com/fcm/send/abc')).toBe(true);
  });
  it('keeps accepting the classic push service hosts',()=>{
    expect(validPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
    expect(validPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true);
    expect(validPushEndpoint('https://web.push.apple.com/abc')).toBe(true);
    expect(validPushEndpoint('https://wns2-bl2p.notify.windows.com/abc')).toBe(true);
  });
  it('rejects look-alike google.com hosts',()=>{
    expect(validPushEndpoint('https://evil.jmt17.google.com/fcm/send/abc')).toBe(false);
    expect(validPushEndpoint('https://jmt17.evil.google.com/fcm/send/abc')).toBe(false);
    expect(validPushEndpoint('https://google.com/fcm/send/abc')).toBe(false);
  });
  it('rejects insecure or credentialed endpoints',()=>{
    expect(validPushEndpoint('http://jmt17.google.com/fcm/send/abc')).toBe(false);
    expect(validPushEndpoint('https://user:pass@jmt17.google.com/fcm/send/abc')).toBe(false);
  });
});
