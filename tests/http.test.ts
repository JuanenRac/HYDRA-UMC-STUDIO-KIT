import { describe, expect, it, vi } from 'vitest';
import { HttpError, createHttpClient, describeHttpError, type FetchLike } from '../src/index.js';

const json = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });

function scripted(...steps: (Response | Error | (() => Promise<Response>))[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, init: init ?? {} });
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    if (step instanceof Error) throw step;
    if (typeof step === 'function') return step();
    return (step as Response).clone();
  };
  return { fetch, calls };
}

const noWait = { sleep: async () => {} };

describe('createHttpClient: requests', () => {
  it('prefixes the base, sends JSON and adds the token', async () => {
    const { fetch, calls } = scripted(json({ ok: 1 }));
    const http = createHttpClient({ baseUrl: 'http://cm5:3000', fetch, getToken: () => 'tok' });
    const out = await http.post('/api/x', { a: 1 });
    expect(out).toEqual({ ok: 1 });
    expect(calls[0]?.url).toBe('http://cm5:3000/api/x');
    expect(calls[0]?.init.method).toBe('POST');
    expect(calls[0]?.init.body).toBe('{"a":1}');
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('adds a query string and skips undefined values', async () => {
    const { fetch, calls } = scripted(json([]));
    const http = createHttpClient({ fetch });
    await http.get('/api/list', { query: { limit: 5, q: 'a b', skip: undefined, none: null } });
    expect(calls[0]?.url).toBe('/api/list?limit=5&q=a+b');
  });

  it('does not send the token to another origin unless switched on', async () => {
    const first = scripted(json({}));
    await createHttpClient({ baseUrl: 'http://cm5:3000', fetch: first.fetch, getToken: () => 'tok' }).get('http://evil.example/steal');
    expect((first.calls[0]?.init.headers as Record<string, string>).Authorization).toBeUndefined();

    const second = scripted(json({}));
    await createHttpClient({ baseUrl: 'http://cm5:3000', fetch: second.fetch, getToken: () => 'tok', sendTokenToOtherOrigins: true }).get('http://other.example/x');
    expect((second.calls[0]?.init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('sends the token to the same origin when the address is absolute', async () => {
    const { fetch, calls } = scripted(json({}));
    await createHttpClient({ baseUrl: 'http://cm5:3000', fetch, getToken: () => 'tok' }).get('http://cm5:3000/api/y');
    expect((calls[0]?.init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('keeps an Authorization header the caller set itself', async () => {
    const { fetch, calls } = scripted(json({}));
    await createHttpClient({ fetch, getToken: () => 'tok' }).get('/a', { headers: { Authorization: 'Basic zzz' } });
    expect((calls[0]?.init.headers as Record<string, string>).Authorization).toBe('Basic zzz');
  });

  it('reads text, nothing and empty bodies', async () => {
    const http = createHttpClient({ fetch: scripted(new Response('plain')).fetch });
    expect(await http.get('/t', { parse: 'text' })).toBe('plain');
    expect(await createHttpClient({ fetch: scripted(new Response(null, { status: 204 })).fetch }).get('/e')).toBeUndefined();
    expect(await createHttpClient({ fetch: scripted(new Response('whatever')).fetch }).get('/n', { parse: 'none' })).toBeUndefined();
  });
});

describe('createHttpClient: failures', () => {
  it('turns an error status into an HttpError with the message of the server', async () => {
    const { fetch } = scripted(json({ error: 'No such robot' }, { status: 404 }));
    const http = createHttpClient({ fetch, ...noWait });
    const error = await http.get('/api/robot/9?token=secret').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    const failure = error as HttpError;
    expect(failure.kind).toBe('http');
    expect(failure.status).toBe(404);
    expect(failure.serverMessage).toBe('No such robot');
    expect(failure.path).toBe('/api/robot/9');
    expect(failure.message).not.toContain('secret');
    expect(failure.attempts).toBe(1);
  });

  it('keeps the text of a body that is not JSON, cut short', async () => {
    const { fetch } = scripted(new Response('x'.repeat(900), { status: 400 }));
    const failure = (await createHttpClient({ fetch }).get('/a').catch((e: unknown) => e)) as HttpError;
    expect(failure.body).toBe('x'.repeat(500));
    expect(failure.serverMessage).toBeUndefined();
  });

  it('reports an answer that is not JSON as a parse failure', async () => {
    const failure = (await createHttpClient({ fetch: scripted(new Response('<html>')).fetch }).get('/a').catch((e: unknown) => e)) as HttpError;
    expect(failure.kind).toBe('parse');
  });

  it('retries a safe call on 503 and honours the order of the waits', async () => {
    const { fetch, calls } = scripted(new Response('', { status: 503 }), new Response('', { status: 502 }), json({ done: true }));
    const waits: number[] = [];
    const http = createHttpClient({ fetch, sleep: async (ms) => { waits.push(ms); }, retryDelayMs: 100 });
    expect(await http.get('/a')).toEqual({ done: true });
    expect(calls).toHaveLength(3);
    expect(waits).toEqual([100, 200]);
  });

  it('gives up after the configured number of retries and says how many times it sent', async () => {
    const { fetch, calls } = scripted(new Response('', { status: 503 }));
    const failure = (await createHttpClient({ fetch, ...noWait, retries: 1 }).get('/a').catch((e: unknown) => e)) as HttpError;
    expect(calls).toHaveLength(2);
    expect(failure.status).toBe(503);
    expect(failure.attempts).toBe(2);
    expect(failure.temporary).toBe(true);
  });

  it('never repeats a POST on its own, but does when it is declared idempotent', async () => {
    const plain = scripted(new Response('', { status: 503 }));
    await createHttpClient({ fetch: plain.fetch, ...noWait }).post('/a', {}).catch(() => undefined);
    expect(plain.calls).toHaveLength(1);

    const idem = scripted(new Response('', { status: 503 }), json({ ok: true }));
    expect(await createHttpClient({ fetch: idem.fetch, ...noWait }).post('/a', {}, { idempotent: true })).toEqual({ ok: true });
    expect(idem.calls).toHaveLength(2);
  });

  it('does not retry a 4xx that is not temporary', async () => {
    const { fetch, calls } = scripted(new Response('', { status: 400 }));
    await createHttpClient({ fetch, ...noWait }).get('/a').catch(() => undefined);
    expect(calls).toHaveLength(1);
  });

  it('retries a network error and then reports it', async () => {
    const { fetch, calls } = scripted(new TypeError('failed to fetch'));
    const failure = (await createHttpClient({ fetch, ...noWait }).get('/a').catch((e: unknown) => e)) as HttpError;
    expect(failure.kind).toBe('network');
    expect(calls).toHaveLength(3);
  });

  it('uses Retry-After but never waits longer than the limit', async () => {
    const { fetch } = scripted(new Response('', { status: 429, headers: { 'retry-after': '120' } }), json({}));
    const waits: number[] = [];
    await createHttpClient({ fetch, sleep: async (ms) => { waits.push(ms); }, maxRetryDelayMs: 3000 }).get('/a');
    expect(waits).toEqual([3000]);
  });

  it('times out a call that does not answer and says so', async () => {
    const hang: FetchLike = (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });
    const failure = (await createHttpClient({ fetch: hang, timeoutMs: 20, retries: 0 }).get('/slow').catch((e: unknown) => e)) as HttpError;
    expect(failure.kind).toBe('timeout');
  });

  it('reports a call cancelled by the caller as aborted and does not retry it', async () => {
    const controller = new AbortController();
    const spy = vi.fn();
    const hang: FetchLike = (_url, init) => new Promise((_resolve, reject) => {
      spy();
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });
    const pending = createHttpClient({ fetch: hang, ...noWait, timeoutMs: 0 }).get('/slow', { signal: controller.signal }).catch((e: unknown) => e);
    controller.abort();
    const failure = (await pending) as HttpError;
    expect(failure.kind).toBe('aborted');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('refreshes the token once on a 401 and repeats the call', async () => {
    let token = 'old';
    const { fetch, calls } = scripted(new Response('', { status: 401 }), json({ fine: true }));
    const http = createHttpClient({
      fetch, getToken: () => token, ...noWait,
      onUnauthorized: () => { token = 'new'; return true; },
    });
    expect(await http.post('/api/x', {})).toEqual({ fine: true });
    expect((calls[0]?.init.headers as Record<string, string>).Authorization).toBe('Bearer old');
    expect((calls[1]?.init.headers as Record<string, string>).Authorization).toBe('Bearer new');
  });

  it('does not loop when the refresh does not help', async () => {
    const { fetch, calls } = scripted(new Response('', { status: 401 }));
    const failure = (await createHttpClient({ fetch, ...noWait, onUnauthorized: () => true }).post('/a', {}).catch((e: unknown) => e)) as HttpError;
    expect(calls).toHaveLength(2);
    expect(failure.status).toBe(401);
  });

  it('attempt() returns the failure instead of throwing', async () => {
    const ok = await createHttpClient({ fetch: scripted(json({ v: 1 })).fetch }).attempt<{ v: number }>('/a');
    expect(ok).toEqual({ ok: true, value: { v: 1 } });
    const bad = await createHttpClient({ fetch: scripted(new Response('', { status: 500 })).fetch, retries: 0 }).attempt('/a');
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.status).toBe(500);
  });
});

describe('describeHttpError', () => {
  const make = (kind: HttpError['kind'], status?: number) => new HttpError({ kind, method: 'GET', path: '/a', status: status ?? null });
  it('answers in the language asked', () => {
    expect(describeHttpError(make('network'), 'en')).toBe('The server cannot be reached.');
    expect(describeHttpError(make('timeout'), 'pt')).toBe('O servidor não respondeu a tempo.');
    expect(describeHttpError(make('http', 401), 'de')).toContain('Sitzung');
    expect(describeHttpError(make('http', 403), 'fr')).toContain('autorisé');
    expect(describeHttpError(make('http', 404), 'es')).toContain('ruta');
    expect(describeHttpError(make('http', 503), 'ja')).toContain('503');
    expect(describeHttpError(make('http', 418), 'zh')).toContain('418');
    expect(describeHttpError(make('aborted'), 'it')).toContain('annullata');
    expect(describeHttpError(make('parse'), 'en')).toContain('could not be read');
  });
});
