/**
 * The vocabulary Souty recognizes today.
 *
 * Each entry ties one output class of the on-device gesture model to the
 * Tunisian Arabic (Derja) word the app displays and speaks. Words are in
 * Arabic script so text-to-speech voices read them correctly.
 *
 * `label` must match the model's category name exactly. Retraining replaces
 * the whole classifier head, so changing the model's classes means updating
 * this list (see docs/TECHNICAL_DOC.md).
 */

export type SignCategory =
  | "requests"
  | "destinations"
  | "family"
  | "days"
  | "transport"
  | "universal";

/** Where the training images for a class come from. */
export type SignSource =
  /** Tunisian Sign Language Dataset (Chakroun & Jerbi, 2023, with ATILS). */
  | "tunsl"
  /** HaGRID-derived universal hand gestures. */
  | "hagrid";

export interface Sign {
  /** Model category name. */
  readonly label: string;
  /** Displayed and spoken word, Tunisian Arabic in Arabic script. */
  readonly word: string;
  /** Meaning, for readers who do not read Arabic. */
  readonly gloss: { readonly en: string; readonly fr: string };
  readonly category: SignCategory;
  readonly source: SignSource;
}

export const SIGNS: readonly Sign[] = [
  // Requests - Tunisian Sign Language
  { label: "assam", word: "أصم", gloss: { en: "deaf", fr: "sourd" }, category: "requests", source: "tunsl" },
  { label: "labes", word: "لاباس", gloss: { en: "I'm fine", fr: "ça va" }, category: "requests", source: "tunsl" },
  { label: "oui", word: "ايه", gloss: { en: "yes", fr: "oui" }, category: "requests", source: "tunsl" },
  { label: "non", word: "لا", gloss: { en: "no", fr: "non" }, category: "requests", source: "tunsl" },
  { label: "siye7a", word: "سياحة", gloss: { en: "tourism", fr: "tourisme" }, category: "requests", source: "tunsl" },
  { label: "ta3raf", word: "تعرف", gloss: { en: "you know", fr: "tu sais" }, category: "requests", source: "tunsl" },
  { label: "5adamet", word: "خدمات", gloss: { en: "services", fr: "services" }, category: "requests", source: "tunsl" },

  // Destinations - Tunisian Sign Language
  { label: "mostawsaf", word: "مستوصف", gloss: { en: "clinic", fr: "dispensaire" }, category: "destinations", source: "tunsl" },
  { label: "sbitar", word: "سبيطار", gloss: { en: "hospital", fr: "hôpital" }, category: "destinations", source: "tunsl" },

  // Family - Tunisian Sign Language
  { label: "bent", word: "بنت", gloss: { en: "daughter", fr: "fille" }, category: "family", source: "tunsl" },
  { label: "bou", word: "بابا", gloss: { en: "dad", fr: "papa" }, category: "family", source: "tunsl" },
  { label: "eben", word: "ابن", gloss: { en: "son", fr: "fils" }, category: "family", source: "tunsl" },
  { label: "jad", word: "جد", gloss: { en: "grandfather", fr: "grand-père" }, category: "family", source: "tunsl" },
  { label: "jadda", word: "جدة", gloss: { en: "grandmother", fr: "grand-mère" }, category: "family", source: "tunsl" },
  { label: "mar2a", word: "مرأة", gloss: { en: "woman", fr: "femme" }, category: "family", source: "tunsl" },
  { label: "tfol", word: "طفل", gloss: { en: "child", fr: "enfant" }, category: "family", source: "tunsl" },

  // Days of the week - Tunisian Sign Language
  { label: "5mis", word: "الخميس", gloss: { en: "Thursday", fr: "jeudi" }, category: "days", source: "tunsl" },
  { label: "sebt", word: "السبت", gloss: { en: "Saturday", fr: "samedi" }, category: "days", source: "tunsl" },
  { label: "thnin", word: "الاثنين", gloss: { en: "Monday", fr: "lundi" }, category: "days", source: "tunsl" },

  // Transport - Tunisian Sign Language
  { label: "car", word: "سيارة", gloss: { en: "car", fr: "voiture" }, category: "transport", source: "tunsl" },
  { label: "louage", word: "لواج", gloss: { en: "shared taxi", fr: "louage" }, category: "transport", source: "tunsl" },
  { label: "metro", word: "مترو", gloss: { en: "metro", fr: "métro" }, category: "transport", source: "tunsl" },
  { label: "train", word: "قطار", gloss: { en: "train", fr: "train" }, category: "transport", source: "tunsl" },

  // Universal hand gestures (overlap with TunSL words is intentional)
  { label: "Open_Palm", word: "عسلامة", gloss: { en: "hello", fr: "bonjour" }, category: "universal", source: "hagrid" },
  { label: "Closed_Fist", word: "وقف", gloss: { en: "stop", fr: "stop" }, category: "universal", source: "hagrid" },
  { label: "Thumb_Up", word: "ايه", gloss: { en: "yes", fr: "oui" }, category: "universal", source: "hagrid" },
  { label: "Thumb_Down", word: "لا", gloss: { en: "no", fr: "non" }, category: "universal", source: "hagrid" },
  { label: "Victory", word: "بالسلامة", gloss: { en: "goodbye", fr: "au revoir" }, category: "universal", source: "hagrid" },
  { label: "Pointing_Up", word: "استنى", gloss: { en: "wait", fr: "attends" }, category: "universal", source: "hagrid" },
  // Tunisian Derja, not the Egyptian/Levantine "تمام"
  { label: "OK_Sign", word: "باهي", gloss: { en: "OK", fr: "d'accord" }, category: "universal", source: "hagrid" },
  // Digits, per Maghreb convention
  { label: "Three_Fingers", word: "3", gloss: { en: "three", fr: "trois" }, category: "universal", source: "hagrid" },
  { label: "Four_Fingers", word: "4", gloss: { en: "four", fr: "quatre" }, category: "universal", source: "hagrid" },
  { label: "Shaka_Sign", word: "مبروك", gloss: { en: "congratulations", fr: "félicitations" }, category: "universal", source: "hagrid" },
];

/** Model categories that mean "no gesture". */
export const NEGATIVE_LABELS: ReadonlySet<string> = new Set(["None", "none"]);

/** Display order for grouped listings. */
export const SIGN_CATEGORIES: readonly SignCategory[] = [
  "requests",
  "family",
  "destinations",
  "days",
  "transport",
  "universal",
];

/** Model label -> spoken word. */
export const WORD_BY_LABEL: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(SIGNS.map((sign) => [sign.label, sign.word]))
);

export const SIGN_COUNT = SIGNS.length;
export const TUNSL_SIGN_COUNT = SIGNS.filter((sign) => sign.source === "tunsl").length;
export const UNIVERSAL_SIGN_COUNT = SIGNS.filter((sign) => sign.source === "hagrid").length;

export function signsByCategory(category: SignCategory): readonly Sign[] {
  return SIGNS.filter((sign) => sign.category === category);
}
