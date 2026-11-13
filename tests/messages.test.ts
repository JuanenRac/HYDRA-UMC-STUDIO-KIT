import { describe, expect, it } from 'vitest';
import { KIT_API_VERSION, LANGUAGES, MESSAGES, kitText, pickLanguage } from '../src/index.js';
import type { Language, MessageKey } from '../src/index.js';

const keys = Object.keys(MESSAGES) as MessageKey[];
const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((found) => found[1] ?? '').sort();

describe('the catalog', () => {
  it('has the eight languages of the ecosystem, in order', () => {
    expect([...LANGUAGES]).toEqual(['en', 'es', 'de', 'fr', 'it', 'ja', 'zh', 'pt']);
  });

  it('has a text for every key in every language', () => {
    expect(keys.length).toBeGreaterThan(20);
    for (const key of keys) {
      for (const language of LANGUAGES) {
        expect(MESSAGES[key][language].trim().length, `${key} in ${language}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the same placeholders in every language of a text', () => {
    for (const key of keys) {
      const english = placeholders(MESSAGES[key].en);
      for (const language of LANGUAGES) {
        expect(placeholders(MESSAGES[key][language]), `${key} in ${language}`).toEqual(english);
      }
    }
  });

  it('does not leave an untranslated copy of the English text in the other languages', () => {
    const longText = keys.filter((key) => MESSAGES[key].en.length > 12);
    for (const key of longText) {
      for (const language of LANGUAGES.filter((l) => l !== 'en')) {
        expect(MESSAGES[key][language], `${key} in ${language}`).not.toBe(MESSAGES[key].en);
      }
    }
  });

  it('writes European Portuguese, not the Brazilian forms', () => {
    const pt = keys.map((key) => MESSAGES[key].pt).join('\n');
    expect(pt).not.toMatch(/\b(você|arquivo|tela|celular|usuário)\b/i);
  });

  it('names the keys by area', () => {
    for (const key of keys) expect(key).toMatch(/^(http|tour|history)\.[a-z_]+$/);
  });

  it('exposes the version of the contract', () => {
    expect(KIT_API_VERSION).toBe(1);
  });
});

describe('pickLanguage', () => {
  it('reads the language of a BCP 47 tag, in any case and with either separator', () => {
    expect(pickLanguage('pt-PT')).toBe('pt');
    expect(pickLanguage('zh_CN')).toBe('zh');
    expect(pickLanguage('DE-at')).toBe('de');
    expect(pickLanguage('ja')).toBe('ja');
  });

  it('falls back to English, or to the fallback given', () => {
    for (const tag of [null, undefined, '', 'xx', 'pl-PL', '-', '123', 'english']) expect(pickLanguage(tag)).toBe('en');
    expect(pickLanguage('xx', 'es')).toBe('es');
    expect(pickLanguage(null, 'fr')).toBe('fr');
  });

  it('returns every language of the kit for its own code', () => {
    for (const language of LANGUAGES) expect(pickLanguage(language)).toBe(language);
  });
});

describe('kitText', () => {
  it('returns the text of the language asked for', () => {
    expect(kitText('es', 'tour.next')).toBe('Siguiente');
    expect(kitText('pt', 'tour.done')).toBe('Concluir');
    expect(kitText('ja', 'tour.back')).toBe('戻る');
  });

  it('fills the placeholders, with numbers and with text', () => {
    expect(kitText('en', 'tour.step', { current: 2, total: 5 })).toBe('Step 2 of 5');
    expect(kitText('de', 'http.server', { status: 502 })).toBe('Der Server ist fehlgeschlagen (HTTP 502).');
    expect(kitText('en', 'http.status', { status: 'x' })).toBe('The server answered HTTP x.');
  });

  it('fills a placeholder every time it appears and leaves a missing one in place', () => {
    expect(kitText('en', 'tour.step', { current: 1 })).toBe('Step 1 of {total}');
    expect(kitText('en', 'tour.step')).toBe('Step {current} of {total}');
  });

  it('ignores parameters the text does not use', () => {
    expect(kitText('en', 'tour.next', { current: 1, other: 'x' })).toBe('Next');
  });

  it('writes a zero as a zero', () => {
    expect(kitText('en', 'tour.step', { current: 0, total: 0 })).toBe('Step 0 of 0');
  });

  it('gives a text for every key and language without leaving a placeholder when all are given', () => {
    const params = { status: 500, current: 1, total: 3 };
    for (const key of keys) {
      for (const language of LANGUAGES as readonly Language[]) {
        expect(kitText(language, key, params)).not.toMatch(/\{\w+\}/);
      }
    }
  });
});
