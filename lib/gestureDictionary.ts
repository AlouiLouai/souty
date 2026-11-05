/**
 * Maps model category names to displayed/spoken words, in Tunisian Arabic
 * (Derja) written in Arabic script so TTS voices read them correctly.
 *
 * Keys must match the model's category names exactly: 23 single-hand
 * Tunisian Sign Language classes plus 10 HaGRID-derived classes. Changing
 * the model's classes means updating this map (see docs/TECHNICAL_DOC.md).
 */
const GESTURE_WORD_MAP: Record<string, string> = {
  // Demandes (general requests) — Tunisian Sign Language
  assam: "أصم", // deaf
  labes: "لاباس", // fine / OK
  oui: "ايه", // yes
  non: "لا", // no
  siye7a: "سياحة", // tourism
  ta3raf: "تعرف", // you know
  "5adamet": "خدمات", // services

  // Destinations — Tunisian Sign Language
  mostawsaf: "مستوصف", // clinic
  sbitar: "سبيطار", // hospital

  // Famille (family) — Tunisian Sign Language
  bent: "بنت", // daughter / girl
  bou: "بابا", // dad
  eben: "ابن", // son
  jad: "جد", // grandfather
  jadda: "جدة", // grandmother
  mar2a: "مرأة", // woman / wife
  tfol: "طفل", // child

  // Jours (days of the week) — Tunisian Sign Language
  "5mis": "الخميس", // Thursday
  sebt: "السبت", // Saturday
  thnin: "الاثنين", // Monday

  // Transport — Tunisian Sign Language
  car: "سيارة", // car
  louage: "لواج", // shared taxi
  metro: "مترو", // metro
  train: "قطار", // train

  // Stock + HaGRID gestures (overlap with TunSL signs is intentional)
  Open_Palm: "عسلامة", // hello
  Closed_Fist: "وقف", // stop
  Thumb_Up: "ايه", // yes
  Thumb_Down: "لا", // no
  Victory: "بالسلامة", // bye / peace
  Pointing_Up: "استنى", // wait
  OK_Sign: "باهي", // OK / good — Tunisian Derja, not the Egyptian/Levantine "تمام"
  // Digits, per Maghreb convention
  Three_Fingers: "3",
  Four_Fingers: "4",
  Shaka_Sign: "مبروك", // congrats
};

/** Categories that mean "no gesture". */
export const IGNORED_LABELS = new Set(["None", "none"]);

/** Display word for a category name; falls back to the readable label. */
export function gestureToWord(categoryName: string): string {
  if (GESTURE_WORD_MAP[categoryName]) return GESTURE_WORD_MAP[categoryName];
  return categoryName.replace(/_/g, " ");
}
