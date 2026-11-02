import { describe, expect, it } from 'vitest';
import { LANGUAGES, MESSAGES, createMemoryStorage, createTourController, kitText, pickLanguage, type TourDefinition } from '../src/index.js';

const tours: TourDefinition[] = [
  { id: 'first-run', steps: ['welcome', 'robots', 'cameras'] },
  { id: 'settings', steps: ['only'], version: 2 },
];

describe('createTourController', () => {
  it('is idle at the start', () => {
    const tour = createTourController({ tours, storage: null });
    expect(tour.get()).toMatchObject({ tourId: null, step: null, total: 0 });
  });

  it('walks forward and back through the steps', () => {
    const tour = createTourController({ tours, storage: null });
    expect(tour.start('first-run')).toBe(true);
    expect(tour.get()).toMatchObject({ tourId: 'first-run', index: 0, step: 'welcome', total: 3, isFirst: true, isLast: false });
    tour.next();
    tour.next();
    expect(tour.get()).toMatchObject({ index: 2, step: 'cameras', isLast: true });
    tour.back();
    expect(tour.get().step).toBe('robots');
    tour.back();
    tour.back();
    expect(tour.get().index).toBe(0);
  });

  it('finishing the last step closes the tour and remembers it', () => {
    const storage = createMemoryStorage();
    const tour = createTourController({ tours, storage });
    tour.start('settings');
    tour.next();
    expect(tour.get().tourId).toBeNull();
    expect(tour.hasSeen('settings')).toBe(true);
    expect(createTourController({ tours, storage }).hasSeen('settings')).toBe(true);
  });

  it('skip closes the tour and remembers it as seen', () => {
    const tour = createTourController({ tours, storage: createMemoryStorage() });
    tour.start('first-run');
    tour.skip();
    expect(tour.get().tourId).toBeNull();
    expect(tour.hasSeen('first-run')).toBe(true);
  });

  it('refuses an unknown tour and does nothing when no tour runs', () => {
    const tour = createTourController({ tours, storage: null });
    expect(tour.start('nope')).toBe(false);
    expect(() => { tour.next(); tour.back(); tour.skip(); }).not.toThrow();
  });

  it('does not start by itself unless autoStart is on, and only for tours not seen', () => {
    const storage = createMemoryStorage();
    expect(createTourController({ tours, storage }).startIfNew('first-run')).toBe(false);
    const auto = createTourController({ tours, storage, autoStart: true });
    expect(auto.startIfNew('first-run')).toBe(true);
    expect(auto.startIfNew('settings')).toBe(false); // one is already running
    auto.skip();
    expect(auto.startIfNew('first-run')).toBe(false); // seen
    expect(auto.startIfNew('nope')).toBe(false);
  });

  it('offers a tour again when its version is raised', () => {
    const storage = createMemoryStorage({ hydra_tours_seen: JSON.stringify({ settings: 1, 'first-run': 1 }) });
    const tour = createTourController({ tours, storage });
    expect(tour.hasSeen('settings')).toBe(false);
    expect(tour.hasSeen('first-run')).toBe(true);
  });

  it('reset forgets one tour or all of them', () => {
    const storage = createMemoryStorage();
    const tour = createTourController({ tours, storage });
    tour.start('first-run');
    tour.skip();
    tour.start('settings');
    tour.skip();
    tour.reset('first-run');
    expect(tour.hasSeen('first-run')).toBe(false);
    expect(tour.hasSeen('settings')).toBe(true);
    tour.reset();
    expect(tour.hasSeen('settings')).toBe(false);
  });

  it('ignores garbage in the storage and rejects a tour without steps', () => {
    const garbage = createMemoryStorage({ hydra_tours_seen: JSON.stringify({ a: 'x', b: -1, 'first-run': 1.5 }) });
    expect(createTourController({ tours, storage: garbage }).hasSeen('first-run')).toBe(false);
    expect(() => createTourController({ tours: [{ id: 'empty', steps: [] }], storage: null })).toThrow();
  });

  it('notifies the subscribers on every change', () => {
    const tour = createTourController({ tours, storage: null });
    let calls = 0;
    tour.subscribe(() => { calls += 1; });
    tour.start('first-run');
    tour.next();
    tour.skip();
    expect(calls).toBe(3);
  });
});

describe('messages', () => {
  it('every text exists in the eight languages and none is empty', () => {
    for (const [key, row] of Object.entries(MESSAGES)) {
      for (const language of LANGUAGES) expect(row[language].trim(), `${key} ${language}`).not.toBe('');
    }
  });

  it('keeps the placeholders of the English text in every language', () => {
    for (const [key, row] of Object.entries(MESSAGES)) {
      const wanted = (row.en.match(/\{\w+\}/g) ?? []).sort();
      for (const language of LANGUAGES) expect((row[language].match(/\{\w+\}/g) ?? []).sort(), `${key} ${language}`).toEqual(wanted);
    }
  });

  it('fills the parameters and leaves an unknown one visible', () => {
    expect(kitText('es', 'tour.step', { current: 2, total: 5 })).toBe('Paso 2 de 5');
    expect(kitText('pt', 'tour.step')).toBe('Passo {current} de {total}');
  });

  it('uses European Portuguese words', () => {
    expect(kitText('pt', 'history.logout')).toBe('Sessão terminada');
    expect(kitText('pt', 'tour.skip')).toBe('Saltar a visita');
  });

  it('picks the language of a tag', () => {
    expect(pickLanguage('pt-PT')).toBe('pt');
    expect(pickLanguage('zh_CN')).toBe('zh');
    expect(pickLanguage('DE-at')).toBe('de');
    expect(pickLanguage('ko-KR')).toBe('en');
    expect(pickLanguage(undefined, 'es')).toBe('es');
  });
});
