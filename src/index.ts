// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/index.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// The public API of the kit. Anything not exported here is internal and may change.

export * from './storage.js';
export * from './store.js';
export * from './session.js';
export * from './apiBase.js';
export * from './http.js';
export * from './history.js';
export * from './prefs.js';
export * from './tours.js';
export * from './messages.js';

/** The version of the contract of the kit that the applications can check at run time. Raised only by a change that is not compatible. */
export const KIT_API_VERSION = 1;
