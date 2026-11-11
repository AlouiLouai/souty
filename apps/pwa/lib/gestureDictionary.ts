/**
 * Maps model category names to displayed/spoken words, in Tunisian Arabic
 * (Derja) written in Arabic script so TTS voices read them correctly.
 *
 * The vocabulary itself lives in `@souty/vocabulary` (packages/vocabulary),
 * the single source of truth shared with the marketing site. Changing the
 * model's classes means updating that list (see docs/TECHNICAL_DOC.md).
 */
import { WORD_BY_LABEL } from "@souty/vocabulary";

/**
 * Whether a model label has a word to say. A model class without a
 * vocabulary entry (for example after a retrain adds signs) is never spoken.
 */
export function hasWord(categoryName: string): boolean {
  return Object.prototype.hasOwnProperty.call(WORD_BY_LABEL, categoryName);
}

/** Display word for a category name; falls back to the readable label. */
export function gestureToWord(categoryName: string): string {
  // Own-property check: a label like "constructor" must not resolve to
  // something inherited from Object.prototype.
  if (hasWord(categoryName)) {
    return WORD_BY_LABEL[categoryName];
  }
  return categoryName.replace(/_/g, " ");
}
