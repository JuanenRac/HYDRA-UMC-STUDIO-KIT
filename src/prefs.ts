// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/prefs.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// The person's own choices about a screen (is the assistant shown, where did they put it, how big is it): a per-browser convenience kept in a storage.
// Each field has a validator, so whatever is in the storage (an older version, a hand-edited value) is turned into a value of the right kind or into
// the default. Reading or writing the storage can fail (private window, blocked site data): the defaults are used, and the choice is kept for this
// visit only. Never keep state here that must survive: it is a convenience.

import { readJson, writeJson, type StorageLike } from './storage.js';
import { createStore, type ReadableStore } from './store.js';

/** Turns an unknown value into a valid one, or undefined to take the default. */
export type Validator<V> = (value: unknown) => V | undefined;

export const bool: Validator<boolean> = (value) => (typeof value === 'boolean' ? value : undefined);
export const finite: Validator<number> = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
export const fraction: Validator<number> = (value) => (typeof value === 'number' && value >= 0 && value <= 1 ? value : undefined);
export const nullableFraction: Validator<number | null> = (value) => (value === null ? null : fraction(value));
export const integerBetween = (min: number, max: number): Validator<number> => (value) =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : undefined;
export const oneOf = <V extends string>(...allowed: readonly V[]): Validator<V> => (value) => (allowed as readonly unknown[]).includes(value) ? (value as V) : undefined;
export const shortText = (maxLength: number): Validator<string> => (value) => (typeof value === 'string' && value.length <= maxLength ? value : undefined);

export type Schema<T> = { [K in keyof T]: Validator<T[K]> };

export interface PrefsOptions<T extends object> {
  storage: StorageLike | null;
  /** The key the preferences are kept under. */
  key: string;
  defaults: T;
  schema: Schema<T>;
}

export interface Prefs<T extends object> extends ReadableStore<T> {
  /** Changes some fields; a value that does not pass its validator is ignored. */
  set(patch: Partial<T>): void;
  /** Back to the defaults (and forgets what was stored). */
  reset(): void;
}

export function createPrefs<T extends object>(options: PrefsOptions<T>): Prefs<T> {
  const { defaults, schema } = options;
  const keys = Object.keys(defaults) as (keyof T)[];

  const sanitize = (raw: unknown): T => {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const next = { ...defaults };
    for (const key of keys) {
      const valid = schema[key](source[key as string]);
      if (valid !== undefined) next[key] = valid;
    }
    return next;
  };

  const store = createStore<T>(sanitize(readJson(options.storage, options.key, null)));
  return {
    get: store.get,
    subscribe: store.subscribe,
    set(patch) {
      const merged: Record<string, unknown> = { ...(store.get() as Record<string, unknown>) };
      for (const key of keys) {
        if (!(key in patch)) continue;
        const valid = schema[key](patch[key]);
        if (valid !== undefined) merged[key as string] = valid;
      }
      const next = merged as T;
      store.set(next);
      writeJson(options.storage, options.key, next);
    },
    reset() {
      store.set({ ...defaults });
      try {
        options.storage?.removeItem(options.key);
      } catch {
        /* nothing stored, or the storage refuses */
      }
    },
  };
}
