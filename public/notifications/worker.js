self.addEventListener('push',event=>{let data;try{data=event.data.json();}catch{return;}if(!data||typeof data.title!=='string')return;const path=typeof data.url==='string'&&/^\/(messages|networking|sessions)(\/|\?|$)/.test(data.url)?data.url:'/messages';event.waitUntil(self.registration.showNotification(data.title,{body:data.body||'',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:data.tag||'genai-message',data:{url:path}}));});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const path = event.notification.data?.url;
    const url = new URL(typeof path === 'string' && /^\/(messages|networking|sessions)(\/|\?|$)/.test(path) ? path : '/messages', self.location.origin).href;
    let windows = [];
    try {
      windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    } catch {
      // A suspended mobile app may not expose its windows. Open it instead.
    }
    const candidates = windows.filter(client => new URL(client.url).origin === self.location.origin);
    candidates.sort((a, b) => Number(b.focused) - Number(a.focused));
    for (const client of candidates) {
      try {
        // Wake the app before navigating: mobile browsers may reject navigation
        // on a background/suspended client, including installed iOS PWAs.
        const focused = await client.focus();
        if (client.url === url) return focused;
        const navigated = await client.navigate(url);
        if (navigated) return navigated;
      } catch {
        // Stale clients must not prevent another window or the app from opening.
      }
    }
    return self.clients.openWindow(url);
  })());
});