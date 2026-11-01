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

export function pushErrorKey(error: unknown): 'push.denied' | 'push.failed' {
  return error !== null && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError' ? 'push.denied' : 'push.failed';
}