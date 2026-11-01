/** Wait for this worker, not serviceWorker.ready (its scope excludes the page). */
export async function activePushRegistration(registration: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (registration.active?.state === 'activated') return registration;
  const worker = registration.installing ?? registration.waiting ?? registration.active;
  if (!worker) throw new Error('PushWorkerUnavailable');
  await new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      worker.removeEventListener('statechange', check);
      if (error) reject(error); else resolve();
    };
    const check = () => {
      if (worker.state === 'activated') finish();
      else if (worker.state === 'redundant') finish(new Error('PushWorkerUnavailable'));
    };
    const timeout = setTimeout(() => finish(new Error('PushWorkerUnavailable')), 10000);
    worker.addEventListener('statechange', check);
    check();
  });
  return registration;
}

export type PushActivationStage = 'permission' | 'configuration' | 'worker' | 'subscription' | 'save';

export function pushErrorKey(error: unknown, stage?: PushActivationStage): 'push.denied' | 'push.failed' | 'push.browserDenied' | 'push.serviceFailed' | 'push.saveFailed' | 'push.workerFailed' {
  const name = error !== null && typeof error === 'object' && 'name' in error ? error.name : '';
  const message = error !== null && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : '';
  // Chrome can return AbortError even when Notification.permission is granted.
  if (name === 'AbortError' && /permission denied/i.test(message)) return 'push.browserDenied';
  if (name === 'NotAllowedError') return 'push.denied';
  if (stage === 'subscription' && (name === 'AbortError' || name === 'NetworkError')) return 'push.serviceFailed';
  if (stage === 'save') return 'push.saveFailed';
  if (stage === 'worker') return 'push.workerFailed';
  return 'push.failed';
}