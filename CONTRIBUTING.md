# Contributing to HYDRA-UMC-STUDIO-KIT 🦾

We welcome contributions to the small TypeScript package that the HYDRA-UMC web clients share: sign-in session storage, connection history, guided tours, local preferences and an HTTP client.

## Technology Stack
- **Language**: TypeScript (strict), ES modules, no runtime dependencies.
- **Tests**: Vitest (the package runs in Node and in a browser; the tests use fakes for `fetch` and for the storage).
- **Checks**: `npm run typecheck`, `npm run lint` and `npm test` must pass before a change is sent.

## Guidelines
1. **No framework in the core.** The package must not import React or any UI library. A binding for a framework belongs in a separate module that only uses the public store contract (`getSnapshot` and `subscribe`).
2. **A stable API.** A change to an exported name, a parameter or a stored key is a breaking change: describe it in `CHANGELOG.md` and in `docs/MIGRATION.md`.
3. **Fail closed.** A sign-in token is never written to a storage the caller did not choose, never logged and never sent to an address other than the one the caller configured. Every security-relevant behaviour has a switch and a conservative default.
4. **Every value that can be tuned is an option**, not a constant buried in the code (timeouts, retry counts, limits, storage keys).
5. **Eight languages.** Any text the package returns to a person comes from a catalog keyed by language: `en`, `es`, `de`, `fr`, `it`, `ja`, `zh` and `pt` (European Portuguese).
6. **Testing**: add a test for every behaviour you add or fix; no test may need the network or a real browser.
