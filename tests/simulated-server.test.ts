// Simulation bench: the real client, session and connection history run against a simulated HYDRA-UMC server that signs people in, lets a
// token expire, answers with bursts of 503, a rate limit, a body that is cut, a server that never answers and a connection that drops.
// Nothing here is a real server, a real network or a real clock.
import { describe, expect, it } from 'vitest';
import { HttpError, createConnectionsApi, createHttpClient, createMemoryStorage, createSession } from '../src/index.js';
import type { FetchLike, HttpClient, Session } from '../src/index.js';

type Fault = 'none' | 'burst503' | 'rate429' | 'cut' | 'hang' | 'drop' | 'html500' | 'empty';

class SimulatedServer {
  validTokens = new Set<string>();
  validRefresh = new Map<string, string>();
  fault: Fault = 'none';
  /** How many of the next requests meet the fault (the rest are answered normally). */
  faultsLeft = 0;
  requests: { method: string; path: string; auth: string | null }[] = [];
  routes = new Map<string, (url: URL) => Response>();
  private issued = 0;

  issue(): { token: string; refreshToken: string } {
    this.issued += 1;
    const token = `access-${this.issued}`;
    const refreshToken = `refresh-${this.issued}`;
    this.validTokens.add(token);
    this.validRefresh.set(refreshToken, token);
    return { token, refreshToken };
  }

  expire(token: string): void {
    this.validTokens.delete(token);
  }

  fetch: FetchLike = async (input, init) => {
    const url = new URL(input, 'http://cm5.test');
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const auth = headers.Authorization ?? null;
    this.requests.push({ method: init?.method ?? 'GET', path: url.pathname, auth });
    if (this.faultsLeft > 0 && this.fault !== 'none') {
      this.faultsLeft -= 1;
      switch (this.fault) {
        case 'burst503': return new Response('busy', { status: 503 });
        case 'rate429': return new Response('{"error":"slow down"}', { status: 429, headers: { 'retry-after': '2' } });
        case 'cut': return new Response('{"clients":[{"id":', { status: 200 });
        case 'html500': return new Response('<html>Internal Server Error</html>', { status: 500 });
        case 'empty': return new Response('', { status: 200 });
        case 'drop': throw new TypeError('connection reset');
        case 'hang': return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
        });
      }
    }
    if (url.pathname === '/api/login' && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as { user?: string; password?: string };
      if (body.password !== 'right') return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      return Response.json(this.issue());
    }
    if (url.pathname === '/api/refresh' && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as { refreshToken?: string };
      if (!body.refreshToken || !this.validRefresh.has(body.refreshToken)) return Response.json({ error: 'refresh refused' }, { status: 401 });
      this.validRefresh.delete(body.refreshToken);
      return Response.json(this.issue());
    }
    const token = auth?.replace(/^Bearer /, '') ?? '';
    if (!this.validTokens.has(token)) return Response.json({ error: 'token not valid' }, { status: 401 });
    const route = this.routes.get(url.pathname);
    return route ? route(url) : Response.json({ error: 'no such route' }, { status: 404 });
  };
}

interface Rig {
  server: SimulatedServer;
  session: Session;
  http: HttpClient;
  sleeps: number[];
  refreshCalls: number;
}

function rig(options: { retries?: number; timeoutMs?: number } = {}): Rig {
  const server = new SimulatedServer();
  const session = createSession({ stores: { local: createMemoryStorage(), session: createMemoryStorage() } });
  const sleeps: number[] = [];
  const state = { refreshCalls: 0 };
  const plain = createHttpClient({ fetch: server.fetch, retries: 0, timeoutMs: 50 });
  const http: HttpClient = createHttpClient({
    fetch: server.fetch,
    getToken: () => session.readToken(),
    retries: options.retries ?? 2,
    timeoutMs: options.timeoutMs ?? 0,
    sleep: async (ms) => { sleeps.push(ms); },
    onUnauthorized: async () => {
      state.refreshCalls += 1;
      const refresh = session.readRefreshToken();
      if (!refresh) return false;
      const result = await plain.attempt<{ token: string; refreshToken: string }>('/api/refresh', { method: 'POST', json: { refreshToken: refresh } });
      if (!result.ok) {
        session.clear();
        return false;
      }
      session.replaceToken(result.value.token, result.value.refreshToken);
      return true;
    },
  });
  return { server, session, http, sleeps, get refreshCalls() { return state.refreshCalls; } };
}

async function signIn(r: Rig): Promise<void> {
  r.server.faultsLeft = 0;
  const plain = createHttpClient({ fetch: r.server.fetch, retries: 0, timeoutMs: 50 });
  const tokens = await plain.post<{ token: string; refreshToken: string }>('/api/login', { user: 'admin', password: 'right' });
  r.session.saveLoginTokens(tokens.token, tokens.refreshToken);
}

describe('sign-in against the simulated server', () => {
  it('signs in, calls with the token and is signed out by a refused login', async () => {
    const r = rig();
    r.server.routes.set('/api/me', () => Response.json({ name: 'admin' }));
    expect(r.session.signedIn.get()).toBe(false);
    await signIn(r);
    expect(r.session.signedIn.get()).toBe(true);
    expect(await r.http.get('/api/me')).toEqual({ name: 'admin' });
    expect(r.server.requests.at(-1)?.auth).toBe(`Bearer ${r.session.readToken()}`);

    const plain = createHttpClient({ fetch: r.server.fetch, retries: 0, timeoutMs: 0 });
    const refused = await plain.attempt('/api/login', { method: 'POST', json: { user: 'admin', password: 'wrong' } });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.error.status).toBe(401);
      expect(refused.error.serverMessage).toBe('Invalid credentials');
      expect(refused.error.attempts).toBe(1);
    }
  });

  it('refreshes an expired token once, repeats the call and keeps the session', async () => {
    const r = rig();
    r.server.routes.set('/api/me', () => Response.json({ name: 'admin' }));
    await signIn(r);
    const old = r.session.readToken() as string;
    r.server.expire(old);
    expect(await r.http.get('/api/me')).toEqual({ name: 'admin' });
    expect(r.refreshCalls).toBe(1);
    expect(r.session.readToken()).not.toBe(old);
    expect(r.session.signedIn.get()).toBe(true);
    expect(r.server.requests.filter((q) => q.path === '/api/me')).toHaveLength(2);
  });

  it('signs the person out when the refresh is refused, and asks only once', async () => {
    const r = rig();
    r.server.routes.set('/api/me', () => Response.json({}));
    await signIn(r);
    r.server.expire(r.session.readToken() as string);
    r.server.validRefresh.clear();
    const result = await r.http.attempt('/api/me');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(401);
    expect(r.refreshCalls).toBe(1);
    expect(r.session.signedIn.get()).toBe(false);
    expect(r.session.readToken()).toBeNull();
  });

  it('does not loop when the new token is refused too', async () => {
    const r = rig();
    await signIn(r);
    r.server.routes.set('/api/me', () => Response.json({}));
    r.server.expire(r.session.readToken() as string);
    const original = r.server.issue.bind(r.server);
    r.server.issue = () => {
      const pair = original();
      r.server.expire(pair.token);
      return pair;
    };
    const result = await r.http.attempt('/api/me');
    expect(result.ok).toBe(false);
    expect(r.refreshCalls).toBe(1);
    expect(r.server.requests.filter((q) => q.path === '/api/me')).toHaveLength(2);
  });
});

describe('faults of the simulated server', () => {
  it('rides out a burst of 503 that is shorter than the retries, with a doubling wait', async () => {
    const r = rig({ retries: 3 });
    await signIn(r);
    r.server.routes.set('/api/state', () => Response.json({ state: 'READY' }));
    r.server.fault = 'burst503';
    r.server.faultsLeft = 3;
    expect(await r.http.get('/api/state')).toEqual({ state: 'READY' });
    expect(r.sleeps).toEqual([250, 500, 1000]);
  });

  it('gives up on a burst longer than the retries and says how many times it asked', async () => {
    const r = rig({ retries: 2 });
    await signIn(r);
    r.server.fault = 'burst503';
    r.server.faultsLeft = 99;
    const result = await r.http.attempt('/api/state');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
      expect(result.error.status).toBe(503);
      expect(result.error.attempts).toBe(3);
      expect(result.error.temporary).toBe(true);
    }
  });

  it('waits what a rate limit asks, but never more than the longest wait', async () => {
    const r = rig({ retries: 1 });
    await signIn(r);
    r.server.routes.set('/api/state', () => Response.json({}));
    r.server.fault = 'rate429';
    r.server.faultsLeft = 1;
    await r.http.get('/api/state');
    expect(r.sleeps).toEqual([2000]);
  });

  it('does not repeat a POST that is not marked as harmless, and repeats one that is', async () => {
    const r = rig({ retries: 2 });
    await signIn(r);
    r.server.routes.set('/api/jobs', () => Response.json({ id: 1 }));
    r.server.fault = 'burst503';
    r.server.faultsLeft = 1;
    const refused = await r.http.attempt('/api/jobs', { method: 'POST', json: { a: 1 } });
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.error.attempts).toBe(1);
    r.server.faultsLeft = 1;
    const repeated = await r.http.attempt('/api/jobs', { method: 'POST', json: { a: 1 }, idempotent: true });
    expect(repeated.ok).toBe(true);
  });

  it('reports a dropped connection as a network failure after the retries', async () => {
    const r = rig({ retries: 1 });
    r.server.fault = 'drop';
    r.server.faultsLeft = 99;
    const result = await r.http.attempt('/api/state');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('network');
      expect(result.error.attempts).toBe(2);
    }
  });

  it('reports a server that never answers as a timeout, and recovers when it answers again', async () => {
    const r = rig({ retries: 1, timeoutMs: 20 });
    await signIn(r);
    r.server.routes.set('/api/state', () => Response.json({ state: 'READY' }));
    r.server.fault = 'hang';
    r.server.faultsLeft = 2;
    const result = await r.http.attempt('/api/state');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('timeout');
    expect(await r.http.get('/api/state')).toEqual({ state: 'READY' });
  });

  it('reports an answer that was cut as a parse failure and never as a value', async () => {
    const r = rig();
    await signIn(r);
    r.server.fault = 'cut';
    r.server.faultsLeft = 1;
    const result = await r.http.attempt('/api/state');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('parse');
  });

  it('keeps the text of an error page without trusting it as JSON', async () => {
    const r = rig({ retries: 0 });
    await signIn(r);
    r.server.fault = 'html500';
    r.server.faultsLeft = 1;
    const result = await r.http.attempt('/api/state');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(500);
      expect(result.error.body).toContain('Internal Server Error');
      expect(result.error.serverMessage).toBeUndefined();
      expect(result.error.temporary).toBe(false);
    }
  });

  it('reads an empty answer as no value', async () => {
    const r = rig();
    await signIn(r);
    r.server.fault = 'empty';
    r.server.faultsLeft = 1;
    expect(await r.http.get('/api/state')).toBeUndefined();
  });

  it('cancels a call on the request of the caller and does not retry it', async () => {
    const r = rig({ retries: 3 });
    await signIn(r);
    r.server.fault = 'hang';
    r.server.faultsLeft = 99;
    const controller = new AbortController();
    const pending = r.http.attempt('/api/state', { signal: controller.signal });
    controller.abort();
    const result = await pending;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('aborted');
      expect(result.error.attempts).toBe(1);
    }
  });
});

describe('the connection history against the simulated server', () => {
  const client = { id: '0123456789abcdef', kind: 'studio', first_seen_utc: '2026-01-01T00:00:00Z', last_seen_utc: '2026-01-02T00:00:00Z', active_sessions: 1 };

  it('answers each failure of the server with its own kind of failure', async () => {
    const r = rig({ retries: 0 });
    await signIn(r);
    const api = createConnectionsApi(r.http);
    expect(await api.clients()).toEqual({ ok: false, failure: 'unsupported' });

    r.server.fault = 'burst503';
    r.server.faultsLeft = 1;
    expect(await api.events()).toEqual({ ok: false, failure: 'http', status: 503 });

    r.server.fault = 'drop';
    r.server.faultsLeft = 1;
    expect(await api.clients()).toEqual({ ok: false, failure: 'network' });

    r.server.fault = 'cut';
    r.server.faultsLeft = 1;
    expect(await api.clients()).toEqual({ ok: true, value: [] });

    r.server.expire(r.session.readToken() as string);
    r.server.validRefresh.clear();
    const forbidden = await api.clients();
    expect(forbidden.ok).toBe(false);
    if (!forbidden.ok) expect(forbidden.failure).toBe('forbidden');
  });

  it('asks for a limited, clamped number of events', async () => {
    const r = rig({ retries: 0 });
    await signIn(r);
    const asked: string[] = [];
    r.server.routes.set('/api/connections/events', (url) => { asked.push(url.searchParams.get('limit') ?? ''); return Response.json({ events: [] }); });
    const api = createConnectionsApi(r.http);
    for (const limit of [0, -5, 7, 7.9, 100000]) await api.events(limit);
    expect(asked).toEqual(['1', '1', '7', '7', '500']);
  });

  it('reads the clients the server lists', async () => {
    const r = rig();
    await signIn(r);
    r.server.routes.set('/api/connections/clients', () => Response.json({ clients: [client, { nonsense: true }] }));
    const answer = await createConnectionsApi(r.http).clients();
    expect(answer.ok).toBe(true);
    if (answer.ok) expect(answer.value.map((c) => c.id)).toEqual(['0123456789abcdef']);
  });
});

describe('a seeded storm of faults', () => {
  it('never throws out of attempt, never exceeds the attempts allowed and keeps the session consistent', async () => {
    let seed = 987654321;
    const next = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const r = rig({ retries: 2, timeoutMs: 15 });
    await signIn(r);
    r.server.routes.set('/api/state', () => Response.json({ state: 'READY' }));
    const faults: Fault[] = ['none', 'burst503', 'rate429', 'cut', 'hang', 'drop', 'html500', 'empty'];
    let good = 0;
    for (let i = 0; i < 120; i += 1) {
      r.server.fault = faults[Math.floor(next() * faults.length)] as Fault;
      r.server.faultsLeft = Math.floor(next() * 4);
      if (next() < 0.1) r.server.expire(r.session.readToken() ?? '');
      if (next() < 0.03) r.server.validRefresh.clear();
      const before = r.server.requests.length;
      const result = await r.http.attempt('/api/state');
      const sent = r.server.requests.length - before;
      expect(sent).toBeLessThanOrEqual(1 + 2 + 1 + 1); // the attempts, plus one repeat after a refresh and the refresh call itself
      if (result.ok) {
        good += 1;
      } else {
        expect(result.error).toBeInstanceOf(HttpError);
        expect(result.error.attempts).toBeLessThanOrEqual(4);
      }
      expect(r.session.signedIn.get()).toBe(r.session.readToken() !== null);
      if (r.session.readToken() === null) await signIn(r);
    }
    expect(good).toBeGreaterThan(20);
  });
});
