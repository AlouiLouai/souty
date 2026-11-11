/**
 * The signs Souty speaks today.
 *
 * Each entry ties one output class of the on-device sign model
 * (`apps/pwa/public/models/sign_model.meta.json` → `labels`) to the Tunisian
 * Arabic (Derja) word the app displays and speaks. Words are in Arabic
 * script so text-to-speech voices read them correctly.
 *
 * `label` must match the model's class name exactly. The model may know
 * more classes than this list: a class without an entry is recognised but
 * never spoken (see docs/TECHNICAL_DOC.md, "Changing the model or the
 * vocabulary").
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
  /**
   * Present while the word or its meaning is a draft that Deaf signers or
   * interpreters (ATILS) still have to confirm. Says what to check.
   */
  readonly toConfirm?: string;
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
  { label: "3aslema", word: "عسلامة", gloss: { en: "hello", fr: "bonjour" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "demande", word: "مطلب", gloss: { en: "request, application", fr: "demande" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "cv", word: "سي في", gloss: { en: "CV", fr: "CV" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "n3awnek", word: "نعاونك", gloss: { en: "I help you", fr: "je t'aide" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "nekteblk", word: "نكتبلك", gloss: { en: "I write it for you", fr: "je te l'écris" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "t7eb", word: "تحب", gloss: { en: "do you want", fr: "tu veux" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "enti", word: "إنتي", gloss: { en: "you", fr: "toi" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "barnamjk", word: "برنامجك", gloss: { en: "your plans", fr: "ton programme" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "ta9ra", word: "تقرا", gloss: { en: "you study", fr: "tu étudies" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "ta3lim", word: "تعليم", gloss: { en: "education", fr: "éducation" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "se7a", word: "صحة", gloss: { en: "health", fr: "santé" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "tha9afa", word: "ثقافة", gloss: { en: "culture", fr: "culture" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "chabeb", word: "شباب", gloss: { en: "youth", fr: "jeunes" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "radio", word: "راديو", gloss: { en: "radio", fr: "radio" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "telvza", word: "تلفزة", gloss: { en: "television", fr: "télévision" }, category: "requests", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },

  // Destinations - Tunisian Sign Language
  { label: "mostawsaf", word: "مستوصف", gloss: { en: "clinic", fr: "dispensaire" }, category: "destinations", source: "tunsl" },
  { label: "sbitar", word: "سبيطار", gloss: { en: "hospital", fr: "hôpital" }, category: "destinations", source: "tunsl" },
  { label: "baladya", word: "بلدية", gloss: { en: "municipality", fr: "mairie" }, category: "destinations", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "wzara", word: "وزارة", gloss: { en: "ministry", fr: "ministère" }, category: "destinations", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "ma7kma", word: "محكمة", gloss: { en: "court", fr: "tribunal" }, category: "destinations", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "bousta", word: "بوسطة", gloss: { en: "post office", fr: "poste" }, category: "destinations", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "banka", word: "بنكة", gloss: { en: "bank", fr: "banque" }, category: "destinations", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "dar", word: "دار", gloss: { en: "home", fr: "maison" }, category: "destinations", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },

  // Family - Tunisian Sign Language
  { label: "bent", word: "بنت", gloss: { en: "daughter", fr: "fille" }, category: "family", source: "tunsl" },
  { label: "bou", word: "بابا", gloss: { en: "dad", fr: "papa" }, category: "family", source: "tunsl" },
  { label: "eben", word: "ابن", gloss: { en: "son", fr: "fils" }, category: "family", source: "tunsl" },
  { label: "jad", word: "جد", gloss: { en: "grandfather", fr: "grand-père" }, category: "family", source: "tunsl" },
  { label: "jadda", word: "جدة", gloss: { en: "grandmother", fr: "grand-mère" }, category: "family", source: "tunsl" },
  { label: "mar2a", word: "مرأة", gloss: { en: "woman", fr: "femme" }, category: "family", source: "tunsl" },
  { label: "tfol", word: "طفل", gloss: { en: "child", fr: "enfant" }, category: "family", source: "tunsl" },
  { label: "om", word: "ماما", gloss: { en: "mum", fr: "maman" }, category: "family", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "3ayla", word: "عايلة", gloss: { en: "family", fr: "famille" }, category: "family", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "5ou", word: "خو", gloss: { en: "brother", fr: "frère" }, category: "family", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "o5t", word: "أخت", gloss: { en: "sister", fr: "sœur" }, category: "family", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "5al-3am", word: "عمّ", gloss: { en: "uncle", fr: "oncle" }, category: "family", source: "tunsl", toConfirm: "Draft: one sign for both uncles? Maternal خال or paternal عمّ? Confirm with ATILS." },

  // Days of the week - Tunisian Sign Language
  { label: "5mis", word: "الخميس", gloss: { en: "Thursday", fr: "jeudi" }, category: "days", source: "tunsl" },
  { label: "sebt", word: "السبت", gloss: { en: "Saturday", fr: "samedi" }, category: "days", source: "tunsl" },
  { label: "thnin", word: "الاثنين", gloss: { en: "Monday", fr: "lundi" }, category: "days", source: "tunsl" },
  { label: "lyoum", word: "اليوم", gloss: { en: "today", fr: "aujourd'hui" }, category: "days", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "thleth", word: "الثلاثاء", gloss: { en: "Tuesday", fr: "mardi" }, category: "days", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "erb3a", word: "الإربعاء", gloss: { en: "Wednesday", fr: "mercredi" }, category: "days", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "jom3a", word: "الجمعة", gloss: { en: "Friday", fr: "vendredi" }, category: "days", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },
  { label: "a7ad", word: "الأحد", gloss: { en: "Sunday", fr: "dimanche" }, category: "days", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },

  // Transport - Tunisian Sign Language
  { label: "car", word: "سيارة", gloss: { en: "car", fr: "voiture" }, category: "transport", source: "tunsl" },
  { label: "louage", word: "لواج", gloss: { en: "shared taxi", fr: "louage" }, category: "transport", source: "tunsl" },
  { label: "metro", word: "مترو", gloss: { en: "metro", fr: "métro" }, category: "transport", source: "tunsl" },
  { label: "train", word: "قطار", gloss: { en: "train", fr: "train" }, category: "transport", source: "tunsl" },
  { label: "taxi", word: "تاكسي", gloss: { en: "taxi", fr: "taxi" }, category: "transport", source: "tunsl", toConfirm: "Draft: confirm the word with ATILS." },

  // Universal hand gestures (overlap with TunSL words, such as عسلامة, is intentional)
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

export { HAND_LANDMARK_COUNT, TUNSL_HANDSHAPES, type HandLandmark } from "./handshapes";
