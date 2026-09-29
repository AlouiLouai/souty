/**
 * Maps the category names produced by the gesture recognition model to
 * display/spoken words, written in Tunisian Arabic (Derja) using Arabic
 * script — not Latin transliteration — so the words are both readable as
 * Arabic and read correctly by an Arabic text-to-speech voice.
 *
 * The first 7 entries match MediaPipe's stock `gesture_recognizer.task`
 * categories. The rest are custom classes trained via the pipeline in
 * training/ (see training/README.md for the full rationale, and what was
 * deliberately left out) — the model file must be retrained to actually
 * recognize them; adding an entry here alone does nothing.
 *
 * A label's key here must exactly match the category name the model
 * reports. To add more, extend both training/dataset/ and this map with
 * matching label -> word entries. No other code changes are required.
 */
export const GESTURE_WORD_MAP: Record<string, string> = {
  Open_Palm: "عسلامة", // hello
  Closed_Fist: "وقف", // stop
  Thumb_Up: "ايه", // yes
  Thumb_Down: "لا", // no
  Victory: "بالسلامة", // bye / peace
  Pointing_Up: "استنى", // wait
  ILoveYou: "نحبك", // I love you

  OK_Sign: "باهي", // OK / good — Tunisian Derja, not the Egyptian/Levantine "تمام"
  // Digits, not spelled-out words: matches the finger count at a glance,
  // and Tunisians commonly write digits inline in Arabic text anyway
  // (Maghreb convention, unlike Mashriq's spelled-out/Eastern numerals).
  Three_Fingers: "3",
  Four_Fingers: "4",
  // Experimental: landmark shape is one finger away from ILoveYou
  // (thumb+pinky vs. thumb+index+pinky) — verify the trained model can
  // reliably tell them apart before relying on this in production.
  Shaka_Sign: "مبروك", // congrats
};

export const IGNORED_LABELS = new Set(["None", "none"]);

export function gestureToWord(categoryName: string): string {
  if (GESTURE_WORD_MAP[categoryName]) return GESTURE_WORD_MAP[categoryName];
  return categoryName.replace(/_/g, " ");
}
