import { en } from './en';
import { de } from './de';

export type Lang = 'en' | 'de';
export type Translations = typeof en;

export const translations = { en, de };

export function t(lang: string): Translations {
    return translations[lang as Lang] ?? translations.en;
}

export const languages: Lang[] = ['en', 'de'];