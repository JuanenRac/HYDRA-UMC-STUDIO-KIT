// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/history.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// Two kinds of history.
//
// 1. The connection history of the server: the clients that connect to it and the history of their sign-ins (the routes GET /api/connections/clients and
//    /api/connections/events), read defensively. A server that predates the routes answers 404 and the result says `unsupported` instead of breaking.
//    The answers hold no password, token or cookie; the address and user agent only come for an administrator, when the server was told to keep them.
// 2. A short local history of the person's own recent choices (the last robots opened, the last files), kept in a storage: bounded, without repeats and
//    safe against a storage that fails.

import type { HttpClient } from './http.js';
import { readJson, writeJson, type StorageLike } from './storage.js';
import { createStore, type ReadableStore } from './store.js';

// ----- the connection history of the server --------------------------------------------------------------------------------------------------------

export const CLIENT_KINDS = ['studio', 'suite', 'android', 'ios', 'dsi', 'watch', 'voice', 'other'] as const;
export type ClientKind = (typeof CLIENT_KINDS)[number];
export const CONNECTION_ACTIONS = ['first_seen', 'login', 'login_failed', 'second_factor_failed', 'logout', 'session_ended', 'session_expired'] as const;
export type ConnectionAction = (typeof CONNECTION_ACTIONS)[number];

export interface ConnectionClient {
  id: string;
  kind: ClientKind;
  user?: string;
  appVersion?: string;
  origin?: 'local' | 'remote';
  twoFactor?: boolean;
  firstSeen: string;
  lastSeen: string;
  lastFailure?: string;
  activeSessions: number;
  loginsOk: number;
  loginsFailed: number;
  ip?: string;
  agent?: string;
}

export interface ConnectionEvent {
  id: number;
  at: string;
  action: ConnectionAction;
  kind: ClientKind;
  clientId: string;
  user?: string;
  origin?: 'local' | 'remote';
  twoFactor?: boolean;
  appVersion?: string;
  ip?: string;
  agent?: string;
}

export type ConnectionsFailure = 'unsupported' | 'forbidden' | 'network' | 'http';
export type ConnectionsResult<T> = { ok: true; value: T } | { ok: false; failure: ConnectionsFailure; status?: number };

const object = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const text = (value: unknown, max: number): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value.slice(0, max) : undefined);
const whole = (value: unknown): number | undefined => (typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined);
const kindOf = (value: unknown): ClientKind => ((CLIENT_KINDS as readonly unknown[]).includes(value) ? (value as ClientKind) : 'other');
const originOf = (value: unknown): 'local' | 'remote' | undefined => (value === 'local' || value === 'remote' ? value : undefined);
const dateOf = (value: unknown): string | undefined => (typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : undefined);

/** The `X-Hydra-Client` header that tells the server which application this is (informative; it never gives more rights). */
export function clientHeader(app: string, version: string): Record<string, string> {
  const name = /^[a-z0-9-]{1,24}$/.test(app) ? app : 'other';
  const safe = /^[0-9A-Za-z._-]{1,24}$/.test(version) ? version : '0';
  return { 'X-Hydra-Client': `${name}/${safe}` };
}

export function parseClient(data: unknown): ConnectionClient | null {
  const r = object(data);
  const firstSeen = dateOf(r.first_seen_utc);
  const lastSeen = dateOf(r.last_seen_utc);
  if (typeof r.id !== 'string' || !/^[0-9a-f]{16}$/.test(r.id) || !firstSeen || !lastSeen) return null;
  const user = text(r.user, 60);
  const appVersion = text(r.app_version, 24);
  const origin = originOf(r.origin);
  const lastFailure = dateOf(r.last_failure_utc);
  const ip = text(r.ip, 64);
  const agent = text(r.agent, 120);
  return {
    id: r.id, kind: kindOf(r.kind), firstSeen, lastSeen,
    activeSessions: whole(r.active_sessions) ?? 0, loginsOk: whole(r.logins_ok) ?? 0, loginsFailed: whole(r.logins_failed) ?? 0,
    ...(user ? { user } : {}), ...(appVersion ? { appVersion } : {}), ...(origin ? { origin } : {}),
    ...(typeof r.two_factor === 'boolean' ? { twoFactor: r.two_factor } : {}),
    ...(lastFailure ? { lastFailure } : {}), ...(ip ? { ip } : {}), ...(agent ? { agent } : {}),
  };
}

export function parseEvent(data: unknown): ConnectionEvent | null {
  const r = object(data);
  const at = dateOf(r.at_utc);
  const id = whole(r.id);
  if (id === undefined || id < 1 || !at || typeof r.client_id !== 'string' || !(CONNECTION_ACTIONS as readonly unknown[]).includes(r.action)) return null;
  const user = text(r.user, 60);
  const appVersion = text(r.app_version, 24);
  const origin = originOf(r.origin);
  const ip = text(r.ip, 64);
  const agent = text(r.agent, 120);
  return {
    id, at, action: r.action as ConnectionAction, kind: kindOf(r.client_kind), clientId: r.client_id,
    ...(user ? { user } : {}), ...(origin ? { origin } : {}), ...(typeof r.two_factor === 'boolean' ? { twoFactor: r.two_factor } : {}),
    ...(appVersion ? { appVersion } : {}), ...(ip ? { ip } : {}), ...(agent ? { agent } : {}),
  };
}

export function parseClients(data: unknown): ConnectionClient[] {
  const list = object(data).clients;
  return Array.isArray(list) ? list.map(parseClient).filter((item): item is ConnectionClient => item !== null) : [];
}

export function parseEvents(data: unknown): ConnectionEvent[] {
  const list = object(data).events;
  return Array.isArray(list) ? list.map(parseEvent).filter((item): item is ConnectionEvent => item !== null) : [];
}

/** Whether an event is something that went wrong (a refused sign-in or a wrong second-step code), to paint it as a warning. */
export const isFailure = (action: ConnectionAction): boolean => action === 'login_failed' || action === 'second_factor_failed';

/** "5s", "12m", "3h 4m", "2d" since a date, short enough for a table cell. */
export function ago(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '-';
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d`;
}

/** The two reads of the connection history over an HTTP client (the client adds the Authorization header and the base address). */
export function createConnectionsApi(http: HttpClient): {
  clients(): Promise<ConnectionsResult<ConnectionClient[]>>;
  events(limit?: number): Promise<ConnectionsResult<ConnectionEvent[]>>;
} {
  async function load<T>(route: string, parse: (data: unknown) => T): Promise<ConnectionsResult<T>> {
    const result = await http.attempt<unknown>(route);
    if (result.ok) return { ok: true, value: parse(result.value) };
    const { error } = result;
    if (error.kind === 'http') {
      if (error.status === 404) return { ok: false, failure: 'unsupported' };
      if (error.status === 401 || error.status === 403) return { ok: false, failure: 'forbidden', status: error.status };
      return { ok: false, failure: 'http', ...(error.status !== null ? { status: error.status } : {}) };
    }
    // a body that is not JSON arrives as an empty list, as before
    if (error.kind === 'parse') return { ok: true, value: parse({}) };
    return { ok: false, failure: 'network' };
  }
  return {
    clients: () => load('/api/connections/clients', parseClients),
    events: (limit = 50) => load(`/api/connections/events?limit=${Math.min(Math.max(Math.trunc(limit), 1), 500)}`, parseEvents),
  };
}

// ----- the local history of recent choices ---------------------------------------------------------------------------------------------------------

export interface RecentListOptions {
  storage: StorageLike | null;
  /** The key the list is kept under. */
  key: string;
  /** How many entries are kept. Default 10. */
  max?: number;
}

export interface RecentList extends ReadableStore<readonly string[]> {
  /** Puts `entry` first; an entry already in the list moves to the front instead of repeating. */
  push(entry: string): void;
  remove(entry: string): void;
  clear(): void;
}

export function createRecentList(options: RecentListOptions): RecentList {
  const max = Math.max(1, Math.trunc(options.max ?? 10));
  const clean = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    for (const item of value) {
      if (typeof item === 'string' && item !== '' && item.length <= 200) seen.add(item);
      if (seen.size >= max) break;
    }
    return [...seen];
  };
  const store = createStore<readonly string[]>(clean(readJson(options.storage, options.key, [])));
  const commit = (next: string[]): void => {
    store.set(next);
    writeJson(options.storage, options.key, next); // a storage that fails leaves the list for this visit only
  };
  return {
    get: store.get,
    subscribe: store.subscribe,
    push: (entry) => { if (entry !== '' && entry.length <= 200) commit(clean([entry, ...store.get().filter((item) => item !== entry)])); },
    remove: (entry) => { commit(store.get().filter((item) => item !== entry)); },
    clear: () => { commit([]); },
  };
}
