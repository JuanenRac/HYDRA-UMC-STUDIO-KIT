// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/tours.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// Guided tours: the state of a walk through the steps of a screen, and the memory of which tours the person has already seen. The kit holds the state
// only (which tour, which step, seen or not); what a step looks like, where it points and what it says stays with the application, which gets the
// buttons of the tour in the eight languages from `kitText`.
//
// A tour never starts by itself unless the application asks for it (`autoStart`, off by default), and a tour whose `version` is higher than the one
// the person saw is offered again, so a screen that changed can show what is new.

import { readJson, writeJson, type StorageLike } from './storage.js';
import { createStore, type ReadableStore } from './store.js';

export interface TourDefinition {
  id: string;
  /** The ids of the steps, in order. At least one. */
  steps: readonly string[];
  /** Raise it when the tour changed enough to be shown again to the people who saw it. Default 1. */
  version?: number;
}

export interface TourState {
  /** The tour that is running, or null. */
  tourId: string | null;
  /** The position of the current step (0 based); 0 when no tour runs. */
  index: number;
  /** The id of the current step, or null. */
  step: string | null;
  total: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface TourControllerOptions {
  tours: readonly TourDefinition[];
  /** Where the seen tours are remembered. Null: only for this visit. */
  storage: StorageLike | null;
  /** The key used in the storage. Default `hydra_tours_seen`. */
  key?: string;
  /** Start a tour that was not seen when `startIfNew` is called. Default false. */
  autoStart?: boolean;
}

export interface TourController extends ReadableStore<TourState> {
  start(tourId: string): boolean;
  /** Starts the tour only when `autoStart` is on and the person has not seen this version of it. */
  startIfNew(tourId: string): boolean;
  next(): void;
  back(): void;
  /** Closes the tour and remembers it as seen. */
  skip(): void;
  hasSeen(tourId: string): boolean;
  /** Forgets one tour (or all of them) so it is offered again. */
  reset(tourId?: string): void;
}

const IDLE: TourState = { tourId: null, index: 0, step: null, total: 0, isFirst: true, isLast: true };

export function createTourController(options: TourControllerOptions): TourController {
  const key = options.key ?? 'hydra_tours_seen';
  const byId = new Map<string, TourDefinition>();
  for (const tour of options.tours) {
    if (tour.steps.length === 0) throw new Error(`The tour "${tour.id}" has no steps.`);
    byId.set(tour.id, tour);
  }

  const loaded = readJson(options.storage, key, {});
  const seen: Record<string, number> = {};
  if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
    for (const [id, version] of Object.entries(loaded as Record<string, unknown>)) {
      if (typeof version === 'number' && Number.isInteger(version) && version >= 1) seen[id] = version;
    }
  }
  const remember = (): void => { writeJson(options.storage, key, seen); };
  const versionOf = (id: string): number => byId.get(id)?.version ?? 1;
  const hasSeen = (id: string): boolean => (seen[id] ?? 0) >= versionOf(id);

  const store = createStore<TourState>(IDLE);
  const at = (tour: TourDefinition, index: number): TourState => ({
    tourId: tour.id, index, step: tour.steps[index] ?? null, total: tour.steps.length, isFirst: index === 0, isLast: index === tour.steps.length - 1,
  });
  const running = (): TourDefinition | null => {
    const id = store.get().tourId;
    return id === null ? null : (byId.get(id) ?? null);
  };
  const close = (): void => {
    const tour = running();
    if (tour) {
      seen[tour.id] = versionOf(tour.id);
      remember();
    }
    store.set(IDLE);
  };

  return {
    get: store.get,
    subscribe: store.subscribe,
    start(tourId) {
      const tour = byId.get(tourId);
      if (!tour) return false;
      store.set(at(tour, 0));
      return true;
    },
    startIfNew(tourId) {
      if (!options.autoStart || hasSeen(tourId) || store.get().tourId !== null) return false;
      const tour = byId.get(tourId);
      if (!tour) return false;
      store.set(at(tour, 0));
      return true;
    },
    next() {
      const tour = running();
      if (!tour) return;
      const state = store.get();
      if (state.isLast) close();
      else store.set(at(tour, state.index + 1));
    },
    back() {
      const tour = running();
      if (!tour) return;
      const state = store.get();
      if (!state.isFirst) store.set(at(tour, state.index - 1));
    },
    skip: close,
    hasSeen,
    reset(tourId) {
      if (tourId === undefined) for (const id of Object.keys(seen)) delete seen[id];
      else delete seen[tourId];
      remember();
    },
  };
}
