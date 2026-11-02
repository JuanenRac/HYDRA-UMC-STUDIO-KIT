<!-- =============================================================================
HYDRA-UMC-STUDIO-KIT - Migration guide for the web clients
Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
GPL-3.0-or-later - see LICENSE
============================================================================= -->

# Migration guide

HYDRA-UMC-STUDIO is the first client meant to consume this kit, and it does not consume it yet: the kit was extracted from the code STUDIO already has, with the same behaviour except where this page says otherwise. ARMOR-STUDIO and URTC-WEB-STUDIO can adopt it later with the same steps; each one keeps its own storage keys and its own texts.

## Before you start

1. The kit repository has a release tag, and the client pins it (a tag, never a branch or a commit): `npm install github:JuanenRac/HYDRA-UMC-STUDIO-KIT#<tag>`. The package builds itself on install (`prepare`).
2. The client's own `npm run typecheck`, `npm run lint` and `npm test` pass before the change.

## What is replaced in HYDRA-UMC-STUDIO

Do one row per commit; the checks of every row are the existing tests of the client, which must pass **unchanged**, plus the extra check in the last column.

| Client file | Replaced by | What stays in the client | Extra check |
| --- | --- | --- | --- |
| `src/lib/session.ts` | `createSession()` | `TOKEN_KEY`, `REFRESH_TOKEN_KEY` and the functions with the same names, as one-line wrappers on a module-level `createSession()`; `authFetch`. Call `adoptLaunchToken(location.href, { acceptQuery: true })` so an app that still opens the view with `?token=` keeps working | `tests/session.test.ts`; sign in with and without "keep me signed in" in the browser and reload |
| `src/lib/apiBase.ts` | `resolveApiBase`, `apiUrl`, `wsUrl` | `API_BASE`, `apiUrl(path)` and `wsUrl(path)` as wrappers that pass `import.meta.env.VITE_API_BASE_URL`, `import.meta.env.DEV` and `window.location` | `tests/apiBase.test.ts`; open the built page from the CM5 and from another host |
| `src/lib/connectionsApi.ts` | `parseClients`, `parseEvents`, `isFailure`, `ago`, `createConnectionsApi` | `clientHeader(version)` as `clientHeader('studio', version)`; the screen `ConnectionHistory.tsx` | `tests/connectionsApi.test.ts`, `tests/connectionHistory.test.tsx` |
| `src/assistant/prefs.ts` | `createPrefs` with the same key (`hydra_assistant_prefs`), the same defaults and one validator per field (`bool`, `nullableFraction`, `oneOf`) | `usePrefs` as `useSyncExternalStore(prefs.subscribe, prefs.get)` | `tests/assistantPrefs.test.ts` |
| `createStore` in `src/lib/accessStore.ts` | `createStore` | the two stores and their hooks | `tests/storeContexts.test.tsx`, `tests/safetyLimits.test.ts` |
| the `loginFailureText` family in `src/lib/serverErrors.ts` | stays; optionally `describeHttpError` for new code | | |
| guided tours | nothing to replace: STUDIO has none today; the kit adds `createTourController` | the content of each step | a new test per tour |

`authFetch` calls spread over the screens are **not** part of this migration: moving a screen to `createHttpClient` changes its retry behaviour (the kit repeats a safe call that failed for a temporary reason), so it is done screen by screen, each with its own test.

## Differences on purpose

* The query form of a launch token is read only with `acceptQuery: true`. The migration sets it to keep the current behaviour; switch it off once every app opens the view with `#token=`.
* The token is sent only to the origin of `baseUrl`. STUDIO calls its own server, so nothing changes; a call to another origin needs `sendTokenToOtherOrigins: true`.
* `clientHeader` takes the application name as its first argument.

## How to confirm the migration is done

1. `grep -rn "window.localStorage\|window.sessionStorage" src/lib src/assistant` finds no storage code that the kit already covers.
2. `npm run typecheck`, `npm run lint` and `npm test` pass; the number of tests does not go down.
3. `npm run build` passes and the size of the main bundle does not grow by more than a few kilobytes (the kit has no dependencies).
4. In a browser: sign in, reload, close the tab and open it again (signed out unless "keep me signed in" was ticked), open the connection history as an administrator, and change an assistant preference and reload.
