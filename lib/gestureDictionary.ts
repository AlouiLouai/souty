/**
 * Maps the category names produced by the gesture recognition model to
 * display/spoken words, written in Tunisian Arabic (Derja) using Arabic
 * script — not Latin transliteration — so the words are both readable as
 * Arabic and read correctly by an Arabic text-to-speech voice.
 *
 * The default MediaPipe `gesture_recognizer.task` model (see
 * public/models/README.md) only ships the 7 built-in categories below.
 *
 * To recognize a full sign-language alphabet or a custom vocabulary, train
 * a custom model with MediaPipe Model Maker and drop it in as
 * public/models/gesture_recognizer.task, then extend this map with your
 * own label -> word entries. No other code changes are required.
 */
export const GESTURE_WORD_MAP: Record<string, string> = {
  Open_Palm: "عسلامة", // hello
  Closed_Fist: "وقف", // stop
  Thumb_Up: "ايه", // yes
  Thumb_Down: "لا", // no
  Victory: "بالسلامة", // bye / peace
  Pointing_Up: "استنى", // wait
  ILoveYou: "نحبك", // I love you
};

export const IGNORED_LABELS = new Set(["None", "none"]);

export function gestureToWord(categoryName: string): string {
  if (GESTURE_WORD_MAP[categoryName]) return GESTURE_WORD_MAP[categoryName];
  return categoryName.replace(/_/g, " ");
}
