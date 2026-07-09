import type { Language } from '../types';

export type { Language };
export type Dictionary = Record<string, string>;
export type Dictionaries = Record<Exclude<Language, 'en'>, Dictionary>;

const dictionaries: Dictionaries = {
  es: {},
  zh: {},
  vi: {},
};

export function setDictionary(lang: Exclude<Language, 'en'>, dict: Dictionary): void {
  dictionaries[lang] = dict;
}

export function getDictionary(lang: Exclude<Language, 'en'>): Dictionary {
  return dictionaries[lang];
}

export function t(key: string, language: Language, clientDict?: Record<string, string>): string {
  if (language === 'en') return key;

  const lower = key.trim().toLowerCase();
  const staticDict = dictionaries[language as Exclude<Language, 'en'>];

  if (staticDict?.[lower]) return staticDict[lower];

  if (clientDict?.[`translation:${language}:${lower}`]) {
    return clientDict[`translation:${language}:${lower}`];
  }

  return key;
}

export function tKey(key: string): string {
  return key.trim().toLowerCase();
}
