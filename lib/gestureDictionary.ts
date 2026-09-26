/**
 * Maps the category names produced by the gesture recognition model to
 * display words, written in Tunisian Arabizi (Tunisian Arabic transliterated
 * with Latin letters + digits, the way it's typed in Messenger/WhatsApp —
 * e.g. 3 for ع, 7 for ح, 9 for ق).
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
  Open_Palm: "Aslema", // hello
  Closed_Fist: "W9ef", // stop
  Thumb_Up: "Eh", // yes
  Thumb_Down: "Le", // no
  Victory: "Bslema", // peace / bye
  Pointing_Up: "Stenna", // wait
  ILoveYou: "N7ebbek", // I love you
};

export const IGNORED_LABELS = new Set(["None", "none"]);

export function gestureToWord(categoryName: string): string {
  if (GESTURE_WORD_MAP[categoryName]) return GESTURE_WORD_MAP[categoryName];
  return categoryName.replace(/_/g, " ");
}
