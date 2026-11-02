// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/session.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// Where the access token and the refresh token of a web client live, and the one way every call gets its Authorization header.
//
// - A login typed into the page is kept in the session storage by default: it survives a reload of the tab but not closing it, and no other tab or
//   later visit can read it. With `persist: true` ("keep me signed in on this device") it goes to the local storage instead, so a restart of the
//   browser and a second tab stay signed in. A login already in the local storage keeps working.
// - A token that arrives in the address is kept in the session storage only: it dies with that view. The apps open an embedded view with it in the
//   fragment (`#token=`), which a browser never sends to a server and no proxy or access log records. The query form (`?token=`) is a switch that
//   is OFF by default (`acceptQuery`), because a query reaches server logs; either way the token is removed from the address as soon as it is read.
// - The refresh token lives in the same storage as the access token it belongs to.

import { browserStorage, safeGet, safeRemove, safeSet, type StorageLike } from './storage.js';
import { createStore, type ReadableStore } from './store.js';

export interface SessionStores {
  local: StorageLike | null;
  session: StorageLike | null;
}

export interface SessionOptions {
  /** Key of the access token. Default `hydra_token` (the key the HYDRA-UMC clients already use). */
  tokenKey?: string;
  /** Key of the refresh token. Default `hydra_refresh_token`. */
  refreshTokenKey?: string;
  /** The two storages. Default: the ones of the page (null where the browser refuses them). */
  stores?: SessionStores;
}

export const DEFAULT_TOKEN_KEY = 'hydra_token';
export const DEFAULT_REFRESH_TOKEN_KEY = 'hydra_refresh_token';

export interface LaunchTokenOptions {
  /** Read the legacy `?token=` form too. Default false: only `#token=` is read. */
  acceptQuery?: boolean;
  /** Name of the parameter. Default `token`. */
  param?: string;
}

/**
 * The token a launch address carries, and the address without it. The fragment form wins over the query form; other parameters and fragment entries are
 * kept. Null when there is no token (or the query form is not accepted and it is the only one) or the address cannot be parsed.
 */
export function extractLaunchToken(href: string, options: LaunchTokenOptions = {}): { token: string; cleanedUrl: string } | null {
  const param = options.param ?? 'token';
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const fromFragment = fragment.get(param);
  const fromQuery = options.acceptQuery ? url.searchParams.get(param) : null;
  const token = fromFragment || fromQuery;
  if (!token) return null;
  fragment.delete(param);
  if (options.acceptQuery) url.searchParams.delete(param);
  url.hash = fragment.toString();
  return { token, cleanedUrl: url.toString() };
}

export interface Session {
  readonly tokenKey: string;
  readonly refreshTokenKey: string;
  /** The access token of this page: the one a launch address brought (session storage) wins over a saved login. */
  readToken(): string | null;
  readRefreshToken(): string | null;
  /** Observable: true while there is an access token. Changes whenever this object stores or clears a token. */
  readonly signedIn: ReadableStore<boolean>;
  /** A token received in the address: kept for this view only. */
  saveLaunchToken(token: string): void;
  /** A login typed into this page. By default it lasts as long as the tab; `persist` keeps it across browser restarts. */
  saveLoginTokens(token: string, refreshToken?: string, persist?: boolean): void;
  /** Replaces the access token wherever it lives (a silent refresh keeps a launch token a launch token). */
  replaceToken(token: string, refreshToken?: string): void;
  clear(): void;
  /** The Authorization header for the current session, merged into `extra`; no header when signed out. */
  authHeaders(extra?: Record<string, string>): Record<string, string>;
  /**
   * Reads the token of a launch address, keeps it for this view and returns the address without it (the caller replaces the address of the page with
   * it, for example with `history.replaceState`). Null when the address carries no token.
   */
  adoptLaunchToken(href: string, options?: LaunchTokenOptions): string | null;
}

export function createSession(options: SessionOptions = {}): Session {
  const tokenKey = options.tokenKey ?? DEFAULT_TOKEN_KEY;
  const refreshTokenKey = options.refreshTokenKey ?? DEFAULT_REFRESH_TOKEN_KEY;
  const stores: SessionStores = options.stores ?? { local: browserStorage('localStorage'), session: browserStorage('sessionStorage') };

  const readToken = (): string | null => safeGet(stores.session, tokenKey) ?? safeGet(stores.local, tokenKey);
  const signedIn = createStore<boolean>(readToken() !== null);
  const refreshState = (): void => signedIn.set(readToken() !== null);

  return {
    tokenKey,
    refreshTokenKey,
    readToken,
    readRefreshToken: () => safeGet(stores.session, refreshTokenKey) ?? safeGet(stores.local, refreshTokenKey),
    signedIn: { get: signedIn.get, subscribe: signedIn.subscribe },
    saveLaunchToken(token) {
      safeSet(stores.session, tokenKey, token);
      refreshState();
    },
    saveLoginTokens(token, refreshToken, persist = false) {
      const keep = persist ? stores.local : stores.session;
      const drop = persist ? stores.session : stores.local;
      // A new login replaces whatever a launch address or an earlier login left in the other storage.
      safeRemove(drop, tokenKey);
      safeSet(keep, tokenKey, token);
      if (typeof refreshToken === 'string') {
        safeSet(keep, refreshTokenKey, refreshToken);
        safeRemove(drop, refreshTokenKey);
      }
      refreshState();
    },
    replaceToken(token, refreshToken) {
      const target = safeGet(stores.session, tokenKey) !== null ? stores.session : stores.local;
      safeSet(target, tokenKey, token);
      if (typeof refreshToken === 'string') safeSet(target, refreshTokenKey, refreshToken);
      refreshState();
    },
    clear() {
      for (const store of [stores.session, stores.local]) {
        safeRemove(store, tokenKey);
        safeRemove(store, refreshTokenKey);
      }
      refreshState();
    },
    authHeaders(extra = {}) {
      const token = readToken();
      return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
    },
    adoptLaunchToken(href, launchOptions) {
      const found = extractLaunchToken(href, launchOptions);
      if (!found) return null;
      safeSet(stores.session, tokenKey, found.token);
      refreshState();
      return found.cleanedUrl;
    },
  };
}
