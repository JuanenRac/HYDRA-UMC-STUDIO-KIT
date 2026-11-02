import { describe, expect, it } from 'vitest';
import {
  ago, clientHeader, createConnectionsApi, createHttpClient, createMemoryStorage, createRecentList, isFailure,
  parseClient, parseClients, parseEvent, parseEvents, type FetchLike,
} from '../src/index.js';

const client = {
  id: '0123456789abcdef', kind: 'studio', user: 'ana', app_version: '0.8.1.0', origin: 'local', two_factor: true,
  first_seen_utc: '2026-01-01T00:00:00Z', last_seen_utc: '2026-01-02T00:00:00Z', active_sessions: 2, logins_ok: 5, logins_failed: 1,
};

describe('parsers', () => {
  it('reads a client and drops what is invalid', () => {
    expect(parseClient(client)).toMatchObject({ id: client.id, kind: 'studio', user: 'ana', appVersion: '0.8.1.0', origin: 'local', twoFactor: true, activeSessions: 2, loginsOk: 5, loginsFailed: 1 });
    expect(parseClient({ ...client, id: 'XYZ' })).toBeNull();
    expect(parseClient({ ...client, last_seen_utc: 'yesterday' })).toBeNull();
    expect(parseClient(null)).toBeNull();
  });

  it('maps an unknown kind to other and cuts long text', () => {
    const parsed = parseClient({ ...client, kind: 'toaster', agent: 'a'.repeat(500) });
    expect(parsed?.kind).toBe('other');
    expect(parsed?.agent).toHaveLength(120);
  });

  it('reads an event and refuses an unknown action or a bad id', () => {
    const event = { id: 4, at_utc: '2026-01-01T00:00:00Z', action: 'login_failed', client_kind: 'android', client_id: 'c1' };
    expect(parseEvent(event)).toMatchObject({ id: 4, action: 'login_failed', kind: 'android', clientId: 'c1' });
    expect(parseEvent({ ...event, action: 'explode' })).toBeNull();
    expect(parseEvent({ ...event, id: 0 })).toBeNull();
    expect(parseEvent({ ...event, id: 1.5 })).toBeNull();
  });

  it('reads lists defensively', () => {
    expect(parseClients({ clients: [client, { nonsense: true }] })).toHaveLength(1);
    expect(parseClients('x')).toEqual([]);
    expect(parseEvents({ events: 'no' })).toEqual([]);
  });
});

describe('helpers', () => {
  it('flags the failures', () => {
    expect(isFailure('login_failed')).toBe(true);
    expect(isFailure('second_factor_failed')).toBe(true);
    expect(isFailure('login')).toBe(false);
  });

  it('writes the age compactly', () => {
    const now = Date.parse('2026-01-10T00:00:00Z');
    expect(ago('2026-01-09T23:59:55Z', now)).toBe('5s');
    expect(ago('2026-01-09T23:48:00Z', now)).toBe('12m');
    expect(ago('2026-01-09T20:56:00Z', now)).toBe('3h 4m');
    expect(ago('2026-01-07T00:00:00Z', now)).toBe('3d');
    expect(ago('nope', now)).toBe('-');
  });

  it('builds the client header and refuses odd characters', () => {
    expect(clientHeader('studio', '0.8.1.0')).toEqual({ 'X-Hydra-Client': 'studio/0.8.1.0' });
    expect(clientHeader('Bad App', 'v 1')).toEqual({ 'X-Hydra-Client': 'other/0' });
  });
});

describe('createConnectionsApi', () => {
  const api = (status: number, body: unknown, raw?: string) => {
    const urls: string[] = [];
    const fetch: FetchLike = async (url) => { urls.push(url); return new Response(raw ?? JSON.stringify(body), { status }); };
    return { urls, api: createConnectionsApi(createHttpClient({ fetch, retries: 0 })) };
  };

  it('returns the clients of a good answer', async () => {
    const { api: connections } = api(200, { clients: [client] });
    const result = await connections.clients();
    expect(result.ok && result.value).toHaveLength(1);
  });

  it('keeps the limit of the events between 1 and 500', async () => {
    const low = api(200, { events: [] });
    await low.api.events(0);
    expect(low.urls[0]).toBe('/api/connections/events?limit=1');
    const high = api(200, { events: [] });
    await high.api.events(9999);
    expect(high.urls[0]).toBe('/api/connections/events?limit=500');
  });

  it('tells an old server (404), a refusal (403), another status and a network failure apart', async () => {
    expect(await api(404, {}).api.clients()).toEqual({ ok: false, failure: 'unsupported' });
    expect(await api(403, {}).api.clients()).toEqual({ ok: false, failure: 'forbidden', status: 403 });
    expect(await api(500, {}).api.events()).toEqual({ ok: false, failure: 'http', status: 500 });
    const down = createConnectionsApi(createHttpClient({ fetch: async () => { throw new TypeError('down'); }, retries: 0 }));
    expect(await down.clients()).toEqual({ ok: false, failure: 'network' });
  });

  it('reads an answer that is not JSON as an empty list', async () => {
    const result = await api(200, null, '<html>').api.clients();
    expect(result).toEqual({ ok: true, value: [] });
  });
});

describe('createRecentList', () => {
  it('puts the newest first, without repeats, up to the limit', () => {
    const list = createRecentList({ storage: createMemoryStorage(), key: 'k', max: 3 });
    for (const item of ['a', 'b', 'c', 'a', 'd']) list.push(item);
    expect(list.get()).toEqual(['d', 'a', 'c']);
  });

  it('is remembered in the storage and cleaned when read back', () => {
    const storage = createMemoryStorage({ k: JSON.stringify(['x', 5, 'y', 'x', '', 'z']) });
    const list = createRecentList({ storage, key: 'k', max: 2 });
    expect(list.get()).toEqual(['x', 'y']);
    list.push('q');
    expect(JSON.parse(storage.getItem('k') as string)).toEqual(['q', 'x']);
  });

  it('removes, clears and tells its subscribers', () => {
    const list = createRecentList({ storage: createMemoryStorage(), key: 'k' });
    let calls = 0;
    list.subscribe(() => { calls += 1; });
    list.push('a');
    list.push('b');
    list.remove('a');
    expect(list.get()).toEqual(['b']);
    list.clear();
    expect(list.get()).toEqual([]);
    expect(calls).toBe(4);
  });

  it('works with a missing or broken storage and with garbage stored', () => {
    const none = createRecentList({ storage: null, key: 'k' });
    none.push('a');
    expect(none.get()).toEqual(['a']);
    expect(createRecentList({ storage: createMemoryStorage({ k: '{broken' }), key: 'k' }).get()).toEqual([]);
  });

  it('ignores empty and overlong entries', () => {
    const list = createRecentList({ storage: null, key: 'k' });
    list.push('');
    list.push('x'.repeat(201));
    expect(list.get()).toEqual([]);
  });
});
