<!-- =============================================================================
HYDRA-UMC-STUDIO-KIT - API reference
Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
GPL-3.0-or-later - see LICENSE
============================================================================= -->

# API reference

Everything below is exported from the package root (`src/index.ts`). Anything else is internal. `KIT_API_VERSION` (currently `1`) is raised only by a change that is not compatible, so an application can check it at run time.

The package has no runtime dependencies and imports no framework (`npm run lint` fails on an import of React). The stores have the shape `{ get, subscribe }`, which is what React's `useSyncExternalStore(store.subscribe, store.get)` expects; any other framework can use them as they are.

## Storage and stores

| Name | What it is |
| --- | --- |
| `StorageLike` | the three methods of a Web Storage the kit uses (`getItem`, `setItem`, `removeItem`) |
| `browserStorage('localStorage' \| 'sessionStorage')` | the storage of the page, or `null` when there is none or the browser refuses it; never throws |
| `createMemoryStorage(initial?)` | a storage in memory, with `dump()`; for tests and for a client that must not write to disk |
| `safeGet`, `safeSet`, `safeRemove` | the three operations without exceptions; `safeSet` returns whether the value was stored |
| `readJson(storage, key, fallback)`, `writeJson(storage, key, value)` | JSON in a storage; the fallback when it is missing or unreadable |
| `createStore(initial)` | an observable value: `get()`, `set(next)`, `subscribe(listener)`; no notification when the value is the same |

## Session

```ts
import { createSession } from 'hydra-umc-studio-kit';

const auth = createSession();                       // keys hydra_token and hydra_refresh_token
auth.saveLoginTokens(token, refreshToken, false);   // false: until the tab closes; true: this device stays signed in
auth.authHeaders({ Accept: 'application/json' });   // adds Authorization: Bearer ... when signed in
const clean = auth.adoptLaunchToken(location.href); // reads #token=..., returns the address without it
if (clean) history.replaceState(null, '', clean);
auth.signedIn.subscribe(() => render(auth.signedIn.get()));
```

* `createSession({ tokenKey?, refreshTokenKey?, stores? })`: `stores` is `{ local, session }`; by default the ones of the page.
* `readToken()`: the token of this view; one that came in the address (session storage) wins over a saved login.
* `saveLaunchToken(token)`: kept for this view only. `saveLoginTokens(token, refreshToken?, persist = false)`: a new login replaces whatever the other storage held. `replaceToken(token, refreshToken?)`: a silent refresh keeps a launch token a launch token. `clear()`: removes every copy.
* `extractLaunchToken(href, { acceptQuery = false, param = 'token' })`: the fragment form (`#token=`) is always read; the query form (`?token=`) only with `acceptQuery: true`, because a query reaches server logs. Other parameters and fragment entries are kept.

## Address of the server

* `resolveApiBase({ configured?, dev?, location? })`: `''` in development behind a proxy; the configured address without trailing slashes; otherwise the origin of the page (same scheme, host and port; no port is invented behind a reverse proxy).
* `apiUrl(base, path)` joins them (an absolute address stays as it is); `wsUrl(base, path, page?)` gives the `ws:` or `wss:` address.

## HTTP client

```ts
import { createHttpClient, describeHttpError, resolveApiBase } from 'hydra-umc-studio-kit';

const http = createHttpClient({
  baseUrl: resolveApiBase({ configured: import.meta.env.VITE_API_BASE_URL, dev: import.meta.env.DEV, location: window.location }),
  getToken: auth.readToken,
  onUnauthorized: async () => refreshTheToken(),     // true: repeat the call once
});
const result = await http.attempt<Robot[]>('/api/robots');
if (!result.ok) showError(describeHttpError(result.error, 'pt'));
```

| Option | Default | Meaning |
| --- | --- | --- |
| `baseUrl` | `''` | prefix of every path |
| `timeoutMs` | `10000` | per attempt, answer and body included; `0` switches it off |
| `retries` | `2` | extra attempts |
| `retryDelayMs`, `maxRetryDelayMs` | `250`, `5000` | the wait doubles each time, with no random jitter; `Retry-After` is honoured up to the limit |
| `retryStatuses` | `408, 425, 429, 502, 503, 504` | statuses worth repeating |
| `retryMethods` | `GET, HEAD, OPTIONS, PUT, DELETE` | a POST is never repeated unless the call says `idempotent: true` |
| `sendTokenToOtherOrigins` | `false` | the token goes only to the origin of `baseUrl` (or to a relative path) |
| `getToken`, `headers`, `fetch`, `sleep` | | the token source, headers of every call, and the two functions tests replace |

Per call (`RequestOptions`): `method`, `json`, `body`, `headers`, `query`, `timeoutMs`, `retries`, `idempotent`, `signal`, `parse` (`'json'` by default, `'text'`, `'none'`). `request` and the shortcuts `get`, `post`, `put`, `delete` throw an `HttpError`; `attempt` returns `{ ok: true, value } | { ok: false, error }`.

`HttpError` has `kind` (`network`, `timeout`, `aborted`, `http`, `parse`), `status`, `path` (without its query), `body`, `serverMessage`, `attempts`, `retryAfterMs` and `temporary`. Its message never contains the token, the query string or a header. `describeHttpError(error, language)` gives the text for a person in one of the eight languages.

## Connection history

* `createConnectionsApi(http)`: `clients()` and `events(limit = 50)` (the limit is kept between 1 and 500) give `{ ok: true, value } | { ok: false, failure: 'unsupported' | 'forbidden' | 'network' | 'http', status? }`; a server without the routes answers `unsupported`.
* `parseClient`, `parseClients`, `parseEvent`, `parseEvents`: defensive parsers (unknown kinds become `other`, text is cut, invalid items are dropped). `isFailure(action)`, `ago(iso, now)`, `clientHeader(app, version)`.
* `createRecentList({ storage, key, max = 10 })`: the person's own recent choices; newest first, no repeats, bounded; `push`, `remove`, `clear`, `get`, `subscribe`.

## Preferences

`createPrefs({ storage, key, defaults, schema })` with one validator per field. A stored value that does not pass its validator is replaced by the default; `set(patch)` ignores invalid values and stores the result; `reset()` forgets it; a storage that fails leaves the choice for this visit. Validators: `bool`, `finite`, `fraction`, `nullableFraction`, `integerBetween(min, max)`, `oneOf(...values)`, `shortText(maxLength)`.

## Guided tours

`createTourController({ tours, storage, key?, autoStart = false })` with `tours: { id, steps: string[], version? }[]`. The state is `{ tourId, index, step, total, isFirst, isLast }`. `start(id)`, `next()` (closes and remembers the tour on its last step), `back()`, `skip()`, `hasSeen(id)`, `reset(id?)`, and `startIfNew(id)`, which starts a tour only when `autoStart` is on and the person has not seen this `version` of it. What a step looks like stays with the application.

## Texts in eight languages

`kitText(language, key, params?)` for the keys of `MESSAGES` (`http.*`, `tour.*`, `history.*`); `LANGUAGES` (`en`, `es`, `de`, `fr`, `it`, `ja`, `zh`, `pt` in European Portuguese); `pickLanguage(tag, fallback = 'en')` maps `pt-PT`, `zh_CN` and the like. A test fails if a text is missing in a language or loses a placeholder.
