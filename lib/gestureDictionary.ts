/**
 * Maps the category names produced by the gesture recognition model to
 * display/spoken words, written in Tunisian Arabic (Derja) using Arabic
 * script — not Latin transliteration — so the words are both readable as
 * Arabic and read correctly by an Arabic text-to-speech voice.
 *
 * Two merged vocabularies, trained together as one 34-class model via
 * training/kaggle_pipeline.ipynb:
 *
 * - 23 pruned, single-hand signs from the real Tunisian Sign Language
 *   dataset (see training/README.md's "Why only 23 of the 57 signs"
 *   section) — the other 34 signs in that source dataset are majority
 *   two-handed or too few clean examples, and were excluded because
 *   MediaPipe's gesture recognizer architecture (both Model Maker's
 *   training and this app's own single-hand-at-a-time inference) cannot
 *   represent a two-handed shape correctly at any amount of training.
 * - 10 classes sourced from HaGRID, reusing the exact mapping proven in
 *   the original 10-class run (commit f1ca435, 95.2% accuracy on that
 *   problem alone): the stock-7-equivalent gestures plus OK_Sign,
 *   Three_Fingers, and Four_Fingers/Shaka_Sign. ILoveYou has no HaGRID
 *   equivalent and stays excluded — would need real photos of that hand
 *   shape in a new Kaggle dataset, not just an entry here.
 *
 * A label's key here must exactly match the category name the model
 * reports. Renaming, adding, or removing a class means updating both
 * training/kaggle_pipeline.ipynb's KEPT_SIGN_LABELS/HAGRID_LABEL_MAP and
 * this map to match exactly — see training/README.md before changing
 * either.
 */
export const GESTURE_WORD_MAP: Record<string, string> = {
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

  // Stock gestures + HaGRID extras (carried over from the original
  // 10-class run — note some overlap in meaning with the TunSL signs
  // above, e.g. Thumb_Up/oui both mean "yes": that's intentional
  // redundancy across two different hand shapes, not a conflict).
  Open_Palm: "عسلامة", // hello
  Closed_Fist: "وقف", // stop
  Thumb_Up: "ايه", // yes
  Thumb_Down: "لا", // no
  Victory: "بالسلامة", // bye / peace
  Pointing_Up: "استنى", // wait
  OK_Sign: "باهي", // OK / good — Tunisian Derja, not the Egyptian/Levantine "تمام"
  // Digits, not spelled-out words: matches the finger count at a glance,
  // and Tunisians commonly write digits inline in Arabic text anyway
  // (Maghreb convention, unlike Mashriq's spelled-out/Eastern numerals).
  Three_Fingers: "3",
  Four_Fingers: "4",
  Shaka_Sign: "مبروك", // congrats
};

export const IGNORED_LABELS = new Set(["None", "none"]);

export function gestureToWord(categoryName: string): string {
  if (GESTURE_WORD_MAP[categoryName]) return GESTURE_WORD_MAP[categoryName];
  return categoryName.replace(/_/g, " ");
}
