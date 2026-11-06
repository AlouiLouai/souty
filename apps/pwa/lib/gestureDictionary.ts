/**
 * Maps model category names to displayed/spoken words, in Tunisian Arabic
 * (Derja) written in Arabic script so TTS voices read them correctly.
 *
 * The vocabulary itself lives in `@souty/vocabulary` (packages/vocabulary),
 * the single source of truth shared with the marketing site. Changing the
 * model's classes means updating that list (see docs/TECHNICAL_DOC.md).
 */
import { NEGATIVE_LABELS, WORD_BY_LABEL } from "@souty/vocabulary";

/** Categories that mean "no gesture". */
export const IGNORED_LABELS = NEGATIVE_LABELS;

/** Display word for a category name; falls back to the readable label. */
export function gestureToWord(categoryName: string): string {
  // Own-property check: a label like "constructor" must not resolve to
  // something inherited from Object.prototype.
  if (Object.prototype.hasOwnProperty.call(WORD_BY_LABEL, categoryName)) {
    return WORD_BY_LABEL[categoryName];
  }
  return categoryName.replace(/_/g, " ");
}
