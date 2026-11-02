import { describe, expect, it } from 'vitest';
import {
  bool, createMemoryStorage, createPrefs, createStore, fraction, integerBetween, nullableFraction, oneOf, readJson, safeGet, safeSet, shortText, writeJson,
} from '../src/index.js';

interface Assistant {
  shown: boolean;
  x: number | null;
  size: 'small' | 'normal' | 'large';
  zoom: number;
  name: string;
}

const defaults: Assistant = { shown: true, x: null, size: 'normal', zoom: 3, name: 'a' };
const schema = {
  shown: bool, x: nullableFraction, size: oneOf('small', 'normal', 'large'), zoom: integerBetween(1, 5), name: shortText(5),
} as const;

describe('createPrefs', () => {
  it('starts from the defaults when nothing is stored', () => {
    const prefs = createPrefs<Assistant>({ storage: createMemoryStorage(), key: 'p', defaults, schema });
    expect(prefs.get()).toEqual(defaults);
  });

  it('turns whatever is stored into valid values field by field', () => {
    const storage = createMemoryStorage({ p: JSON.stringify({ shown: 'yes', x: 0.25, size: 'huge', zoom: 9, name: 'toolong', extra: 1 }) });
    const prefs = createPrefs<Assistant>({ storage, key: 'p', defaults, schema });
    expect(prefs.get()).toEqual({ shown: true, x: 0.25, size: 'normal', zoom: 3, name: 'a' });
  });

  it('survives garbage, arrays and a missing storage', () => {
    expect(createPrefs<Assistant>({ storage: createMemoryStorage({ p: '{broken' }), key: 'p', defaults, schema }).get()).toEqual(defaults);
    expect(createPrefs<Assistant>({ storage: createMemoryStorage({ p: '[1,2]' }), key: 'p', defaults, schema }).get()).toEqual(defaults);
    const none = createPrefs<Assistant>({ storage: null, key: 'p', defaults, schema });
    none.set({ shown: false });
    expect(none.get().shown).toBe(false);
  });

  it('merges a change, ignores an invalid value, stores the result and notifies', () => {
    const storage = createMemoryStorage();
    const prefs = createPrefs<Assistant>({ storage, key: 'p', defaults, schema });
    let calls = 0;
    prefs.subscribe(() => { calls += 1; });
    prefs.set({ size: 'large', zoom: 99, x: 0.5 });
    expect(prefs.get()).toEqual({ ...defaults, size: 'large', x: 0.5 });
    expect(JSON.parse(storage.getItem('p') as string)).toMatchObject({ size: 'large', x: 0.5 });
    expect(calls).toBe(1);
  });

  it('a second instance reads what the first one wrote', () => {
    const storage = createMemoryStorage();
    createPrefs<Assistant>({ storage, key: 'p', defaults, schema }).set({ shown: false });
    expect(createPrefs<Assistant>({ storage, key: 'p', defaults, schema }).get().shown).toBe(false);
  });

  it('reset goes back to the defaults and forgets the stored value', () => {
    const storage = createMemoryStorage();
    const prefs = createPrefs<Assistant>({ storage, key: 'p', defaults, schema });
    prefs.set({ shown: false });
    prefs.reset();
    expect(prefs.get()).toEqual(defaults);
    expect(storage.getItem('p')).toBeNull();
  });

  it('keeps the choice for the visit when the storage throws', () => {
    const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem: () => { throw new Error('x'); } };
    const prefs = createPrefs<Assistant>({ storage: broken, key: 'p', defaults, schema });
    prefs.set({ shown: false });
    expect(prefs.get().shown).toBe(false);
    expect(() => prefs.reset()).not.toThrow();
  });
});

describe('validators', () => {
  it('accept only the right kind', () => {
    expect(bool(true)).toBe(true);
    expect(bool(1)).toBeUndefined();
    expect(fraction(1.1)).toBeUndefined();
    expect(fraction(0)).toBe(0);
    expect(nullableFraction(null)).toBeNull();
    expect(nullableFraction('0.2')).toBeUndefined();
    expect(integerBetween(1, 3)(2.5)).toBeUndefined();
    expect(oneOf('a', 'b')('c')).toBeUndefined();
    expect(shortText(2)('abc')).toBeUndefined();
  });
});

describe('store and storage helpers', () => {
  it('createStore does not notify when the value is the same', () => {
    const store = createStore(1);
    let calls = 0;
    const stop = store.subscribe(() => { calls += 1; });
    store.set(1);
    store.set(2);
    stop();
    store.set(3);
    expect(calls).toBe(1);
    expect(store.get()).toBe(3);
  });

  it('readJson and writeJson fall back instead of throwing', () => {
    const storage = createMemoryStorage();
    expect(readJson(storage, 'k', 'fallback')).toBe('fallback');
    expect(writeJson(storage, 'k', { a: 1 })).toBe(true);
    expect(readJson(storage, 'k', null)).toEqual({ a: 1 });
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(writeJson(storage, 'c', circular)).toBe(false);
    expect(safeSet(null, 'k', 'v')).toBe(false);
    expect(safeGet(undefined, 'k')).toBeNull();
  });
});
