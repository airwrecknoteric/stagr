import { de } from './de';
import { en } from './en';

export type Locale = 'de' | 'en';
export type MessageKey = keyof typeof de;

const catalogs = { de, en } as const;

export const defaultLocale: Locale = 'de';

export function t(key: MessageKey, locale: Locale = defaultLocale): string {
	return catalogs[locale][key] ?? de[key];
}
