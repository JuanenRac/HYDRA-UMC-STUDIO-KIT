// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/storage.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// The smallest storage the kit needs, and the safe way to use one. Reading or writing a browser storage can throw (a private window, blocked site
// data, a full quota): every helper here swallows that and reports it through its return value, so a screen never breaks because it could not
// remember something.

/** What the kit uses of a Web Storage object. A `Storage` fits; so does the in-memory one below. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** The storage of the page, or null when there is none or the browser refuses it. Never throws. */
export function browserStorage(kind: 'localStorage' | 'sessionStorage'): StorageLike | null {
  try {
    const found = (globalThis as unknown as Record<string, StorageLike | undefined>)[kind];
    return found ?? null;
  } catch {
    return null;
  }
}

/** A storage that lives in memory only: for tests, for a server-side render and for a client that must not write to disk. */
export function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: (key) => { data.delete(key); },
    dump: () => Object.fromEntries(data),
  };
}

export function safeGet(store: StorageLike | null | undefined, key: string): string | null {
  try {
    return store ? store.getItem(key) : null;
  } catch {
    return null;
  }
}

/** True when the value was stored. */
export function safeSet(store: StorageLike | null | undefined, key: string, value: string): boolean {
  try {
    if (!store) return false;
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(store: StorageLike | null | undefined, key: string): void {
  try {
    store?.removeItem(key);
  } catch {
    /* nothing to remove */
  }
}

/** A JSON value read from a storage; `fallback` when it is missing, unreadable or not JSON. */
export function readJson(store: StorageLike | null | undefined, key: string, fallback: unknown): unknown {
  const raw = safeGet(store, key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return fallback;
  }
}

export function writeJson(store: StorageLike | null | undefined, key: string, value: unknown): boolean {
  try {
    return safeSet(store, key, JSON.stringify(value));
  } catch {
    return false;
  }
}
