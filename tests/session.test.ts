import { describe, expect, it } from 'vitest';
import { createMemoryStorage, createSession, extractLaunchToken, type SessionStores } from '../src/index.js';

function setup() {
  const local = createMemoryStorage();
  const session = createMemoryStorage();
  const stores: SessionStores = { local, session };
  return { local, session, auth: createSession({ stores }) };
}

describe('extractLaunchToken', () => {
  it('reads the fragment form and removes it, keeping the rest of the address', () => {
    const found = extractLaunchToken('https://cm5.local/studio/?robot=3#token=abc&tab=cameras');
    expect(found).toEqual({ token: 'abc', cleanedUrl: 'https://cm5.local/studio/?robot=3#tab=cameras' });
  });

  it('ignores the query form unless it is switched on', () => {
    expect(extractLaunchToken('https://cm5.local/?token=abc')).toBeNull();
    expect(extractLaunchToken('https://cm5.local/?token=abc&x=1', { acceptQuery: true })).toEqual({ token: 'abc', cleanedUrl: 'https://cm5.local/?x=1' });
  });

  it('prefers the fragment over the query and cleans both', () => {
    const found = extractLaunchToken('https://h/?token=q#token=f', { acceptQuery: true });
    expect(found).toEqual({ token: 'f', cleanedUrl: 'https://h/' });
  });

  it('returns null for an address without a token or one that cannot be parsed', () => {
    expect(extractLaunchToken('https://h/#tab=1')).toBeNull();
    expect(extractLaunchToken('not an address')).toBeNull();
  });

  it('supports another parameter name', () => {
    expect(extractLaunchToken('https://h/#jwt=zz', { param: 'jwt' })?.token).toBe('zz');
  });
});

describe('createSession', () => {
  it('keeps a typed login in the session storage by default', () => {
    const { auth, local, session } = setup();
    auth.saveLoginTokens('t1', 'r1');
    expect(session.getItem('hydra_token')).toBe('t1');
    expect(session.getItem('hydra_refresh_token')).toBe('r1');
    expect(local.getItem('hydra_token')).toBeNull();
    expect(auth.readToken()).toBe('t1');
    expect(auth.readRefreshToken()).toBe('r1');
  });

  it('keeps the login in the local storage when asked, and drops the other copy', () => {
    const { auth, local, session } = setup();
    auth.saveLoginTokens('t1', 'r1');
    auth.saveLoginTokens('t2', 'r2', true);
    expect(local.getItem('hydra_token')).toBe('t2');
    expect(local.getItem('hydra_refresh_token')).toBe('r2');
    expect(session.getItem('hydra_token')).toBeNull();
    expect(session.getItem('hydra_refresh_token')).toBeNull();
  });

  it('lets a launch token win over a saved login without replacing it', () => {
    const { auth, local } = setup();
    auth.saveLoginTokens('saved', undefined, true);
    auth.saveLaunchToken('launch');
    expect(auth.readToken()).toBe('launch');
    expect(local.getItem('hydra_token')).toBe('saved');
  });

  it('a silent refresh keeps a launch token a launch token', () => {
    const { auth, local, session } = setup();
    auth.saveLaunchToken('launch');
    auth.replaceToken('fresh', 'rr');
    expect(session.getItem('hydra_token')).toBe('fresh');
    expect(local.getItem('hydra_token')).toBeNull();
  });

  it('replaces the token in the local storage when that is where the login is', () => {
    const { auth, local } = setup();
    auth.saveLoginTokens('a', 'b', true);
    auth.replaceToken('c');
    expect(local.getItem('hydra_token')).toBe('c');
    expect(local.getItem('hydra_refresh_token')).toBe('b');
  });

  it('clear removes every copy and tells the subscribers', () => {
    const { auth } = setup();
    const seen: boolean[] = [];
    auth.signedIn.subscribe(() => seen.push(auth.signedIn.get()));
    auth.saveLoginTokens('a', 'b', true);
    auth.saveLaunchToken('c');
    auth.clear();
    expect(auth.readToken()).toBeNull();
    expect(auth.readRefreshToken()).toBeNull();
    expect(seen).toEqual([true, false]);
  });

  it('adds the Authorization header only when signed in and keeps the extra headers', () => {
    const { auth } = setup();
    expect(auth.authHeaders({ A: '1' })).toEqual({ A: '1' });
    auth.saveLoginTokens('tok');
    expect(auth.authHeaders({ A: '1' })).toEqual({ A: '1', Authorization: 'Bearer tok' });
  });

  it('adoptLaunchToken stores the token and hands back the clean address', () => {
    const { auth } = setup();
    expect(auth.adoptLaunchToken('https://h/p#token=xyz')).toBe('https://h/p');
    expect(auth.readToken()).toBe('xyz');
    expect(auth.adoptLaunchToken('https://h/p')).toBeNull();
  });

  it('uses other keys when told to', () => {
    const { local, session } = setup();
    const other = createSession({ tokenKey: 'a_token', refreshTokenKey: 'a_refresh', stores: { local, session } });
    other.saveLoginTokens('x', 'y');
    expect(session.getItem('a_token')).toBe('x');
    expect(session.getItem('hydra_token')).toBeNull();
  });

  it('survives a storage that throws and one that is missing', () => {
    const broken = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const auth = createSession({ stores: { local: broken, session: null } });
    expect(() => auth.saveLoginTokens('a', 'b', true)).not.toThrow();
    expect(auth.readToken()).toBeNull();
    expect(() => auth.clear()).not.toThrow();
  });

  it('starts signed in when the storage already holds a token', () => {
    const session = createMemoryStorage({ hydra_token: 'old' });
    expect(createSession({ stores: { local: null, session } }).signedIn.get()).toBe(true);
  });
});
