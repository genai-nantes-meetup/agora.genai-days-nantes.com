import {describe,expect,it,vi} from 'vitest';
import {activePushRegistration,pushErrorKey} from './push-registration';

describe('push worker activation',()=>{
  it('waits for a newly installed notification worker before returning it',async()=>{
    const worker=Object.assign(new EventTarget(),{state:'installing'});
    const registration={installing:worker,active:null,waiting:null} as unknown as ServiceWorkerRegistration;
    let resolved=false;
    const pending=activePushRegistration(registration).then(()=>{resolved=true;});
    await Promise.resolve();
    expect(resolved).toBe(false);
    worker.state='activated';worker.dispatchEvent(new Event('statechange'));
    await pending;expect(resolved).toBe(true);
  });
  it('returns an already activated worker immediately',async()=>{
    const registration={active:{state:'activated'}} as unknown as ServiceWorkerRegistration;
    expect(await activePushRegistration(registration)).toBe(registration);
  });
  it('rejects failed activation instead of subscribing with a redundant worker',async()=>{
    const worker=Object.assign(new EventTarget(),{state:'redundant'});
    await expect(activePushRegistration({installing:worker} as unknown as ServiceWorkerRegistration)).rejects.toThrow('PushWorkerUnavailable');
  });
  it('times out when installation is stuck',async()=>{
    vi.useFakeTimers();
    try {
      const worker=Object.assign(new EventTarget(),{state:'installing'});
      const pending=expect(activePushRegistration({installing:worker} as unknown as ServiceWorkerRegistration)).rejects.toThrow('PushWorkerUnavailable');
      await vi.advanceTimersByTimeAsync(10000);await pending;
    } finally {vi.useRealTimers();}
  });
  it('distinguishes a browser permission refusal from a temporary failure',()=>{
    expect(pushErrorKey(new DOMException('','NotAllowedError'))).toBe('push.denied');
    expect(pushErrorKey(new Error('network'))).toBe('push.failed');
  });
  it('recognizes Chrome permission-denied AbortError rather than suggesting a different browser context',()=>{
    expect(pushErrorKey(new DOMException('Registration failed - permission denied','AbortError'),'subscription')).toBe('push.browserDenied');
  });
  it('distinguishes unavailable browser push service from registration saving failure',()=>{
    expect(pushErrorKey(new DOMException('Registration failed - push service error','AbortError'),'subscription')).toBe('push.serviceFailed');
    expect(pushErrorKey(new Error('Failed'),'save')).toBe('push.saveFailed');
    expect(pushErrorKey(new Error('PushWorkerUnavailable'),'worker')).toBe('push.workerFailed');
  });
});