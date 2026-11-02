// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/store.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// A tiny observable value. `get` and `subscribe` have the shape that React's `useSyncExternalStore(store.subscribe, store.get)` expects, so a
// React client can bind any store of the kit in one line, and a client with another framework (or none) uses it as it is. The kit itself never
// imports a framework.

export interface ReadableStore<T> {
  /** The current value. The same object is returned until the value changes, so it is safe as a snapshot. */
  get(): T;
  /** Calls `listener` after every change; returns the function that stops it. */
  subscribe(listener: () => void): () => void;
}

export interface Store<T> extends ReadableStore<T> {
  set(next: T): void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of [...listeners]) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
