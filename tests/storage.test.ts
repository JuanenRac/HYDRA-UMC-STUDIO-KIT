import { afterEach, describe, expect, it } from 'vitest';
import { browserStorage, createMemoryStorage, createStore, readJson, safeGet, safeRemove, safeSet, writeJson } from '../src/index.js';
import type { StorageLike } from '../src/index.js';

/** A storage that refuses everything, like a private window or a full quota. */
const refusing: StorageLike = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('quota'); },
  removeItem: () => { throw new Error('blocked'); },
};

describe('createMemoryStorage', () => {
  it('starts empty or from the initial values', () => {
    expect(createMemoryStorage().dump()).toEqual({});
    expect(createMemoryStorage({ a: '1' }).getItem('a')).toBe('1');
  });

  it('answers null for a key it does not have, and keeps an empty string apart from it', () => {
    const storage = createMemoryStorage();
    expect(storage.getItem('missing')).toBeNull();
    storage.setItem('empty', '');
    expect(storage.getItem('empty')).toBe('');
  });

  it('replaces, removes and dumps', () => {
    const storage = createMemoryStorage({ a: '1' });
    storage.setItem('a', '2');
    storage.setItem('b', '3');
    storage.removeItem('a');
    storage.removeItem('never-there');
    expect(storage.dump()).toEqual({ b: '3' });
  });

  it('writes values as text', () => {
    const storage = createMemoryStorage();
    storage.setItem('n', 5 as unknown as string);
    expect(storage.getItem('n')).toBe('5');
  });

  it('gives a dump that is a copy', () => {
    const storage = createMemoryStorage({ a: '1' });
    const copy = storage.dump();
    copy['a'] = 'changed';
    expect(storage.getItem('a')).toBe('1');
  });

  it('keeps two storages apart', () => {
    const first = createMemoryStorage();
    const second = createMemoryStorage();
    first.setItem('k', 'v');
    expect(second.getItem('k')).toBeNull();
  });
});

describe('the safe helpers', () => {
  it('read, write and remove on a working storage', () => {
    const storage = createMemoryStorage();
    expect(safeSet(storage, 'k', 'v')).toBe(true);
    expect(safeGet(storage, 'k')).toBe('v');
    safeRemove(storage, 'k');
    expect(safeGet(storage, 'k')).toBeNull();
  });

  it('treat a missing storage as an empty one', () => {
    for (const none of [null, undefined]) {
      expect(safeGet(none, 'k')).toBeNull();
      expect(safeSet(none, 'k', 'v')).toBe(false);
      expect(() => safeRemove(none, 'k')).not.toThrow();
      expect(readJson(none, 'k', 'fallback')).toBe('fallback');
      expect(writeJson(none, 'k', 1)).toBe(false);
    }
  });

  it('swallow a storage that refuses and say so by the return value', () => {
    expect(safeGet(refusing, 'k')).toBeNull();
    expect(safeSet(refusing, 'k', 'v')).toBe(false);
    expect(() => safeRemove(refusing, 'k')).not.toThrow();
    expect(readJson(refusing, 'k', 7)).toBe(7);
    expect(writeJson(refusing, 'k', { a: 1 })).toBe(false);
  });
});

describe('readJson and writeJson', () => {
  it('round-trip plain values', () => {
    const storage = createMemoryStorage();
    for (const value of [0, 'text', true, null, [1, 'a', null], { a: { b: [1, 2] } }, '']) {
      expect(writeJson(storage, 'k', value)).toBe(true);
      expect(readJson(storage, 'k', 'fallback')).toEqual(value);
    }
  });

  it('use the fallback for a missing key and for text that is not JSON', () => {
    const storage = createMemoryStorage({ bad: '{broken', empty: '' });
    expect(readJson(storage, 'missing', 'f')).toBe('f');
    expect(readJson(storage, 'bad', 'f')).toBe('f');
    expect(readJson(storage, 'empty', 'f')).toBe('f');
  });

  it('read a stored null as null, not as the fallback', () => {
    expect(readJson(createMemoryStorage({ k: 'null' }), 'k', 'f')).toBeNull();
  });

  it('refuse to write what JSON cannot hold, without throwing', () => {
    const storage = createMemoryStorage();
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    expect(writeJson(storage, 'circular', circular)).toBe(false);
    expect(writeJson(storage, 'big', { n: 10n })).toBe(false);
    expect(storage.dump()).toEqual({});
  });

  it('round-trip a seeded set of random documents', () => {
    let seed = 20261113;
    const next = (): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const make = (depth: number): unknown => {
      const pick = next();
      if (depth > 2 || pick < 0.3) return [Math.floor(next() * 1000) - 500, 'x'.repeat(Math.floor(next() * 6)), next() < 0.5, null][Math.floor(next() * 4)];
      if (pick < 0.65) return Array.from({ length: Math.floor(next() * 4) }, () => make(depth + 1));
      return Object.fromEntries(Array.from({ length: Math.floor(next() * 4) }, (_, i) => [`k${i}`, make(depth + 1)]));
    };
    const storage = createMemoryStorage();
    for (let i = 0; i < 200; i += 1) {
      const document = make(0);
      expect(writeJson(storage, 'doc', document)).toBe(true);
      expect(readJson(storage, 'doc', 'fallback')).toEqual(document);
    }
  });
});

describe('browserStorage', () => {
  const holder = globalThis as unknown as Record<string, unknown>;
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete holder['localStorage'];
    delete holder['sessionStorage'];
  });

  it('is null when the page has no such storage', () => {
    delete holder['localStorage'];
    delete holder['sessionStorage'];
    expect(browserStorage('localStorage')).toBeNull();
    expect(browserStorage('sessionStorage')).toBeNull();
  });

  it('returns the storage the page has', () => {
    const fake = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: fake, configurable: true, writable: true });
    holder['sessionStorage'] = fake;
    expect(browserStorage('localStorage')).toBe(fake);
    expect(browserStorage('sessionStorage')).toBe(fake);
  });

  it('is null, not an error, when the browser refuses access to it', () => {
    Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('SecurityError'); }, configurable: true });
    expect(browserStorage('localStorage')).toBeNull();
  });
});

describe('createStore', () => {
  it('holds the first value and returns the same object until it changes', () => {
    const value = { n: 1 };
    const store = createStore(value);
    expect(store.get()).toBe(value);
    expect(store.get()).toBe(store.get());
  });

  it('notifies after every change and not for the same value', () => {
    const store = createStore(1);
    let calls = 0;
    store.subscribe(() => { calls += 1; });
    store.set(1);
    expect(calls).toBe(0);
    store.set(2);
    store.set(3);
    expect(calls).toBe(2);
    expect(store.get()).toBe(3);
  });

  it('tells a listener the new value is already readable', () => {
    const store = createStore('a');
    const seen: string[] = [];
    store.subscribe(() => seen.push(store.get()));
    store.set('b');
    expect(seen).toEqual(['b']);
  });

  it('stops notifying after the function it returned is called, and tolerates calling it twice', () => {
    const store = createStore(0);
    let calls = 0;
    const stop = store.subscribe(() => { calls += 1; });
    store.set(1);
    stop();
    stop();
    store.set(2);
    expect(calls).toBe(1);
  });

  it('treats NaN as unchanged and 0 and -0 as different, like Object.is', () => {
    const store = createStore(Number.NaN);
    let calls = 0;
    store.subscribe(() => { calls += 1; });
    store.set(Number.NaN);
    expect(calls).toBe(0);
    const zero = createStore(0);
    zero.subscribe(() => { calls += 1; });
    zero.set(-0);
    expect(calls).toBe(1);
  });

  it('keeps notifying the others when one listener stops itself during a change', () => {
    const store = createStore(0);
    const order: string[] = [];
    const stopFirst = store.subscribe(() => { order.push('first'); stopFirst(); });
    store.subscribe(() => order.push('second'));
    store.set(1);
    store.set(2);
    expect(order).toEqual(['first', 'second', 'second']);
  });

  it('does not call a listener added during a change until the next one', () => {
    const store = createStore(0);
    const order: string[] = [];
    store.subscribe(() => {
      order.push('outer');
      store.subscribe(() => order.push('inner'));
    });
    store.set(1);
    expect(order).toEqual(['outer']);
    store.set(2);
    expect(order).toContain('inner');
  });

  it('keeps two stores apart', () => {
    const a = createStore(1);
    const b = createStore(1);
    let calls = 0;
    b.subscribe(() => { calls += 1; });
    a.set(2);
    expect(calls).toBe(0);
  });
});
