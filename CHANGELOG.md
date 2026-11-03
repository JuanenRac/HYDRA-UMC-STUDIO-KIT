# Changelog

All notable changes to this project are documented here.

## [Unreleased]

## [0.0.2] - The package builds itself when a client installs it from a release tag, so the compiled dist is available without a separate build step

- **The package builds itself when a client installs it from a release tag** (`prepare` runs the TypeScript build), so `npm install github:JuanenRac/HYDRA-UMC-STUDIO-KIT#<tag>` gives the compiled `dist/`.

## [0.0.1] - First version of the shared kit for the web clients, with no runtime dependencies and no framework

- **`createSession`:** the access and refresh tokens in the session storage by default and in the local storage only when the person asks to stay signed in; a token that arrives in the address is read from the fragment (the query form is a switch, off by default), kept for that view only and removed from the address.
- **`createHttpClient`:** a timeout on every attempt, bounded retries with a doubling wait for the calls that are safe to repeat (never a POST on its own), `Retry-After`, one token refresh on a 401, the token sent only to the configured origin (a switch, off by default), and `HttpError` with a kind (network, timeout, aborted, http, parse), the status and the message of the server, never the token or the query.
- **`resolveApiBase`, `apiUrl` and `wsUrl`:** the address of the server in development behind a proxy and in a static build.
- **`createConnectionsApi`** with the parsers of the client list and of the sign-in history, `ago`, `isFailure` and `clientHeader`; **`createRecentList`** for the recent choices of a person.
- **`createPrefs`** with validators for the local preferences, **`createTourController`** for guided tours (never starts by itself unless asked, offers a tour again when its version is raised) and a small observable store that React binds with `useSyncExternalStore` in one line.
- **The texts the kit returns to a person** (server errors, tour buttons, sign-in events) in English, Spanish, German, French, Italian, Japanese, Chinese and European Portuguese.
- **`docs/API.md`** documents the API and **`docs/MIGRATION.md`** the steps for HYDRA-UMC-STUDIO to consume the kit and how each step is checked. 86 tests with fakes for `fetch` and for the storage.
