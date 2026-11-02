// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/http.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// The HTTP client of a web client: one place that decides the address, the Authorization header, the time a call may take, which failures are tried
// again and how a failure is told to the caller.
//
// - Every call has a timeout (`timeoutMs`) that covers the answer AND the reading of its body.
// - A failure is tried again only when it is probably temporary (a network error, a timeout, 408/425/429/502/503/504) AND the method is safe to repeat
//   (GET, HEAD, OPTIONS, PUT, DELETE), or the caller says the call is idempotent. A POST is never repeated on its own: it may have reached the server.
//   The wait grows by doubling up to a limit, with no random jitter, so a test can assert it; a `Retry-After` of the server is honoured up to that limit.
// - A failure is always an `HttpError` with a `kind` (network, timeout, aborted, http, parse), the status, and the message the server sent. Its text
//   never contains the token, the query string or a header.
// - The token goes only to the origin of `baseUrl` (or to a relative path): an absolute address on another origin gets none unless
//   `sendTokenToOtherOrigins` is switched on. The default is the conservative one.

import { apiUrl } from './apiBase.js';
import { kitText, type Language } from './messages.js';

export type HttpErrorKind = 'network' | 'timeout' | 'aborted' | 'http' | 'parse';

export interface HttpErrorInit {
  kind: HttpErrorKind;
  method: string;
  path: string;
  status?: number | null;
  body?: unknown;
  serverMessage?: string;
  attempts?: number;
  retryAfterMs?: number | null;
  cause?: unknown;
}

export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  readonly method: string;
  /** The path of the call without its query string. */
  readonly path: string;
  /** The HTTP status for `kind === 'http'`, otherwise null. */
  readonly status: number | null;
  /** The body of an error answer: parsed JSON when it was JSON, otherwise the first 500 characters of the text. */
  readonly body: unknown;
  /** The `error` or `message` text of a JSON error body, cut to 200 characters. */
  readonly serverMessage: string | undefined;
  /** How many times the request was sent. */
  readonly attempts: number;
  readonly retryAfterMs: number | null;

  constructor(init: HttpErrorInit) {
    const detail = init.kind === 'http' ? `HTTP ${String(init.status)}` : init.kind;
    super(`${init.method} ${init.path}: ${detail}`, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'HttpError';
    this.kind = init.kind;
    this.method = init.method;
    this.path = init.path;
    this.status = init.status ?? null;
    this.body = init.body;
    this.serverMessage = init.serverMessage;
    this.attempts = init.attempts ?? 1;
    this.retryAfterMs = init.retryAfterMs ?? null;
  }

  /** Whether trying the same call again could help. */
  get temporary(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || (this.kind === 'http' && this.status !== null && DEFAULT_RETRY_STATUSES.includes(this.status));
  }
}

/** The text to show a person for a failure, in one of the eight languages. */
export function describeHttpError(error: HttpError, language: Language): string {
  switch (error.kind) {
    case 'network': return kitText(language, 'http.network');
    case 'timeout': return kitText(language, 'http.timeout');
    case 'aborted': return kitText(language, 'http.aborted');
    case 'parse': return kitText(language, 'http.parse');
    default: {
      const status = error.status ?? 0;
      if (status === 401) return kitText(language, 'http.unauthorized');
      if (status === 403) return kitText(language, 'http.forbidden');
      if (status === 404) return kitText(language, 'http.not_found');
      if (status >= 500) return kitText(language, 'http.server', { status });
      return kitText(language, 'http.status', { status });
    }
  }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: HttpError };

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const DEFAULT_RETRY_STATUSES: readonly number[] = [408, 425, 429, 502, 503, 504];
export const DEFAULT_RETRY_METHODS: readonly string[] = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'];

export interface HttpClientOptions {
  /** Prefix of every path ('' for relative paths behind a proxy). Default ''. */
  baseUrl?: string;
  /** The fetch to use. Default: the global one. */
  fetch?: FetchLike;
  /** Time one attempt may take, answer and body included. Default 10000. 0 switches the timeout off. */
  timeoutMs?: number;
  /** Extra attempts after the first one. Default 2. */
  retries?: number;
  /** Wait before the first retry; it doubles each time. Default 250. */
  retryDelayMs?: number;
  /** Longest wait between two attempts, `Retry-After` included. Default 5000. */
  maxRetryDelayMs?: number;
  retryStatuses?: readonly number[];
  retryMethods?: readonly string[];
  /** Headers of every call. */
  headers?: Record<string, string>;
  /** The access token, asked before every attempt. */
  getToken?: () => string | null;
  /** Send the token to an absolute address on another origin than `baseUrl`. Default false. */
  sendTokenToOtherOrigins?: boolean;
  /** Called once per call on a 401; return true after refreshing the token to repeat the call. */
  onUnauthorized?: () => boolean | Promise<boolean>;
  /** The waiting function. Default: a timer. Replaced in tests. */
  sleep?: (ms: number) => Promise<void>;
}

export interface RequestOptions {
  method?: string;
  /** A value sent as JSON (sets Content-Type). */
  json?: unknown;
  /** A raw body (not together with `json`). */
  body?: BodyInit;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  timeoutMs?: number;
  retries?: number;
  /** Declares that repeating this call is harmless, so a POST may be tried again. */
  idempotent?: boolean;
  signal?: AbortSignal;
  /** How to read a good answer. Default 'json' (an empty body gives undefined). */
  parse?: 'json' | 'text' | 'none';
}

export interface HttpClient {
  request<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  /** Like `request`, but a failure is returned, never thrown. */
  attempt<T = unknown>(path: string, options?: RequestOptions): Promise<Result<T>>;
  get<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  post<T = unknown>(path: string, json?: unknown, options?: RequestOptions): Promise<T>;
  put<T = unknown>(path: string, json?: unknown, options?: RequestOptions): Promise<T>;
  delete<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
}

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => { setTimeout(resolve, ms); });

function splitPath(path: string): { pathOnly: string } {
  const cut = path.search(/[?#]/);
  return { pathOnly: cut === -1 ? path : path.slice(0, cut) };
}

function withQuery(path: string, query: RequestOptions['query']): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const text = params.toString();
  if (!text) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${text}`;
}

function sameOrigin(full: string, base: string): boolean {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(full)) return true; // a relative address goes to the origin of the page
  try {
    return base !== '' && new URL(full).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

function retryAfterOf(headers: Headers): number | null {
  const value = headers.get('retry-after');
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds * 1000));
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

function readBody(text: string): { body: unknown; serverMessage: string | undefined } {
  let body: unknown = text.slice(0, 500);
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    /* not JSON: the text stays */
  }
  let serverMessage: string | undefined;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;
    const candidate = typeof record.error === 'string' ? record.error : typeof record.message === 'string' ? record.message : '';
    serverMessage = candidate.trim() ? candidate.trim().slice(0, 200) : undefined;
  }
  return { body, serverMessage };
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const baseUrl = options.baseUrl ?? '';
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 250;
  const maxRetryDelayMs = options.maxRetryDelayMs ?? 5_000;
  const retryStatuses = options.retryStatuses ?? DEFAULT_RETRY_STATUSES;
  const retryMethods = (options.retryMethods ?? DEFAULT_RETRY_METHODS).map((m) => m.toUpperCase());
  const sleep = options.sleep ?? defaultSleep;

  async function once(method: string, path: string, request: RequestOptions): Promise<unknown> {
    const { pathOnly } = splitPath(path);
    const full = apiUrl(baseUrl, withQuery(path, request.query));
    const headers: Record<string, string> = { ...options.headers, ...request.headers };
    const token = options.getToken?.() ?? null;
    if (token && (options.sendTokenToOtherOrigins || sameOrigin(full, baseUrl)) && !('Authorization' in headers)) {
      headers.Authorization = `Bearer ${token}`;
    }
    let body: BodyInit | undefined = request.body;
    if (request.json !== undefined) {
      body = JSON.stringify(request.json);
      if (!Object.keys(headers).some((name) => name.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    let timedOut = false;
    const limit = request.timeoutMs ?? timeoutMs;
    const timer = limit > 0 ? setTimeout(() => { timedOut = true; controller.abort(); }, limit) : null;
    const onCallerAbort = (): void => controller.abort();
    if (request.signal) {
      if (request.signal.aborted) controller.abort();
      else request.signal.addEventListener('abort', onCallerAbort, { once: true });
    }
    const fail = (kind: HttpErrorKind, extra: Partial<HttpErrorInit> = {}): HttpError => new HttpError({ kind, method, path: pathOnly, ...extra });

    try {
      const doFetch: FetchLike = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
      let response: Response;
      let text = '';
      try {
        response = await doFetch(full, { method, headers, ...(body !== undefined ? { body } : {}), signal: controller.signal });
        text = request.parse === 'none' && response.ok ? '' : await response.text();
      } catch (cause) {
        if (request.signal?.aborted) throw fail('aborted', { cause });
        if (timedOut) throw fail('timeout', { cause });
        throw fail('network', { cause });
      }
      if (!response.ok) {
        const { body: errorBody, serverMessage } = readBody(text);
        throw fail('http', { status: response.status, body: errorBody, ...(serverMessage !== undefined ? { serverMessage } : {}), retryAfterMs: retryAfterOf(response.headers) });
      }
      if (request.parse === 'none') return undefined;
      if (request.parse === 'text') return text;
      if (text.trim() === '') return undefined;
      try {
        return JSON.parse(text) as unknown;
      } catch (cause) {
        throw fail('parse', { status: response.status, cause });
      }
    } finally {
      if (timer !== null) clearTimeout(timer);
      request.signal?.removeEventListener('abort', onCallerAbort);
    }
  }

  async function run(path: string, request: RequestOptions): Promise<unknown> {
    const method = (request.method ?? (request.json !== undefined ? 'POST' : 'GET')).toUpperCase();
    const maxRetries = request.retries ?? retries;
    const mayRepeat = request.idempotent === true || retryMethods.includes(method);
    let sent = 0;
    let refreshed = false;
    let failures = 0;
    for (;;) {
      sent += 1;
      try {
        return await once(method, path, request);
      } catch (caught) {
        const error = caught instanceof HttpError ? caught : new HttpError({ kind: 'network', method, path: splitPath(path).pathOnly, cause: caught });
        if (error.kind === 'http' && error.status === 401 && options.onUnauthorized && !refreshed) {
          refreshed = true;
          if (await options.onUnauthorized()) continue;
        }
        const worthRepeating = error.kind === 'network' || error.kind === 'timeout' || (error.kind === 'http' && error.status !== null && retryStatuses.includes(error.status));
        if (!mayRepeat || !worthRepeating || failures >= maxRetries || request.signal?.aborted) {
          throw new HttpError({
            kind: error.kind, method, path: error.path, status: error.status, body: error.body, attempts: sent, retryAfterMs: error.retryAfterMs, cause: error.cause,
            ...(error.serverMessage !== undefined ? { serverMessage: error.serverMessage } : {}),
          });
        }
        const wait = Math.min(maxRetryDelayMs, Math.max(retryDelayMs * 2 ** failures, error.retryAfterMs ?? 0));
        failures += 1;
        await sleep(wait);
      }
    }
  }

  const client: HttpClient = {
    request: (path, request = {}) => run(path, request) as Promise<never>,
    attempt: async (path, request = {}) => {
      try {
        return { ok: true, value: (await run(path, request)) as never };
      } catch (error) {
        return { ok: false, error: error as HttpError };
      }
    },
    get: (path, request = {}) => run(path, { ...request, method: 'GET' }) as Promise<never>,
    post: (path, json, request = {}) => run(path, { ...request, method: 'POST', ...(json !== undefined ? { json } : {}) }) as Promise<never>,
    put: (path, json, request = {}) => run(path, { ...request, method: 'PUT', ...(json !== undefined ? { json } : {}) }) as Promise<never>,
    delete: (path, request = {}) => run(path, { ...request, method: 'DELETE' }) as Promise<never>,
  };
  return client;
}
