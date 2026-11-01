import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const origin = 'https://hey.genai-days-nantes.com';
const source = readFileSync('public/notifications/worker.js', 'utf8');

function worker(windows: unknown[] = []) {
  const listeners = new Map<string, (event: unknown) => void>();
  const clients = { matchAll: vi.fn().mockResolvedValue(windows), openWindow: vi.fn().mockResolvedValue({}) };
  runInNewContext(source, {
    URL,
    self: { location: { origin }, clients, addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener) },
  });
  return {
    clients,
    click: async (url = '/messages') => {
      const handler = listeners.get('notificationclick');
      if (!handler) throw new Error('Missing notification click handler');
      let pending: Promise<unknown> | undefined;
      handler({ notification: { close: vi.fn(), data: { url } }, waitUntil: (value: Promise<unknown>) => { pending = value; } });
      await pending;
    },
  };
}

describe('notification opens the mobile app', () => {
  it('focuses the suspended app before navigating to the conversation', async () => {
    const calls: string[] = [];
    const client = {
      url: `${origin}/`,
      focus: vi.fn(async () => { calls.push('focus'); return client; }),
      navigate: vi.fn(async () => { calls.push('navigate'); return client; }),
    };
    const app = worker([client]);
    await app.click('/messages/123?from_push=message');
    expect(calls).toEqual(['focus', 'navigate']);
    expect(client.navigate).toHaveBeenCalledWith(`${origin}/messages/123?from_push=message`);
    expect(app.clients.openWindow).not.toHaveBeenCalled();
  });

  it.each(['focus', 'navigate'])('opens the app when a stale client rejects %s', async failure => {
    const client = {
      url: `${origin}/`,
      focus: vi.fn().mockResolvedValue({}),
      navigate: vi.fn().mockResolvedValue({}),
    };
    client[failure as 'focus' | 'navigate'].mockRejectedValue(new Error('Suspended client'));
    const app = worker([client]);
    await app.click('/messages/123');
    expect(app.clients.openWindow).toHaveBeenCalledWith(`${origin}/messages/123`);
  });

  it('opens the app if navigation returns no usable window', async () => {
    const app = worker([{ url: `${origin}/`, focus: vi.fn().mockResolvedValue({}), navigate: vi.fn().mockResolvedValue(null) }]);
    await app.click();
    expect(app.clients.openWindow).toHaveBeenCalledWith(`${origin}/messages`);
  });

  it('opens the app when no window exists or discovery fails', async () => {
    const app = worker();
    await app.click();
    expect(app.clients.openWindow).toHaveBeenCalledWith(`${origin}/messages`);
    app.clients.matchAll.mockRejectedValue(new Error('Unavailable'));
    await app.click('/networking?from_push=request');
    expect(app.clients.openWindow).toHaveBeenLastCalledWith(`${origin}/networking?from_push=request`);
  });

  it('never opens an external destination from notification data', async () => {
    const app = worker();
    await app.click('https://other.example/messages');
    expect(app.clients.openWindow).toHaveBeenCalledWith(`${origin}/messages`);
  });
});