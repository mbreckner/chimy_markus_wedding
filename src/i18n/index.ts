import { en } from './en';
import { de } from './de';

export type Lang = 'en' | 'de';
export type Translations = typeof en;

export const translations = { en, de };

export function getLang(url: URL): Lang {
    const path = url.pathname;
    if (path.startsWith('/de')) return 'de';
    return 'en';
}

export function t(lang: Lang): Translations {
    return translations[lang];
}