import type { Locale } from "@/i18n/config";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

/** The shape of all site copy. Defined by the English source. */
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, fr, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Fills `{name}` placeholders in a dictionary string. */
export function format(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
