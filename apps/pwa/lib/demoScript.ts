/**
 * Proof-of-concept script: Jawher introduces himself and asks to register
 * as self-employed.
 *
 *   مرحباً أنا جوهر حلاق من سيدي بوزيد نحب نحل باتيندة مبادر ذاتي
 *
 * The shipped model has no class for most of these words (there is no
 * training data for them yet, see training/README.md). For the demo, each
 * word is carried by a sign the model already reads reliably, picked to be
 * as close as possible in meaning or shape. THESE ARE STAND-INS, NOT THE
 * REAL TUNISIAN SIGNS for these words. Replace this file with real classes
 * once the clips are recorded.
 *
 * Turned on with `?demo=jawher` in the URL (remembered on the device),
 * turned off with `?demo=off`. Outside the demo the vocabulary is untouched.
 */

/** Model label -> word spoken in the demo. */
export const DEMO_WORDS: Readonly<Record<string, string>> = {
  // Greeting: the open hand, and the real TunSL hello.
  Open_Palm: "مرحباً",
  "3aslema": "مرحباً",
  // An index finger: pointing is how "I" is signed. Both pointing classes,
  // so either reading of a finger aimed at the chest gives the same word.
  Pointing_Up: "أنا",
  enti: "أنا",
  // A name sign is personal by nature; this one is Jawher's for the demo.
  Shaka_Sign: "جوهر",
  // Two fingers as scissors.
  Victory: "حلاق",
  // The town sign (municipality). Sign languages rarely sign "from" apart.
  baladya: "من سيدي بوزيد",
  // Same verb as تحب (you want), first person.
  t7eb: "نحب",
  // A first-person action verb, stand-in for "I open".
  n3awnek: "نحل",
  // An administrative application.
  demande: "باتيندة",
  // "Your project": the closest sign to an independent venture.
  barnamjk: "مبادر ذاتي",
};

const STORAGE_KEY = "souty.demo";
const DEMO_NAME = "jawher";

let active: boolean | undefined;

/** Whether the demo script is on for this device. Always false on the server. */
export function isDemoActive(): boolean {
  if (typeof window === "undefined") return false;
  if (active !== undefined) return active;
  const requested = new URLSearchParams(window.location.search).get("demo");
  try {
    if (requested === DEMO_NAME) window.localStorage.setItem(STORAGE_KEY, DEMO_NAME);
    else if (requested !== null) window.localStorage.removeItem(STORAGE_KEY);
    active = window.localStorage.getItem(STORAGE_KEY) === DEMO_NAME;
  } catch {
    // Storage blocked (private mode): the URL alone decides, for this page.
    active = requested === DEMO_NAME;
  }
  return active;
}

/** The demo word for a model label, or null outside the demo. */
export function demoWord(label: string): string | null {
  if (!isDemoActive()) return null;
  return Object.prototype.hasOwnProperty.call(DEMO_WORDS, label) ? DEMO_WORDS[label]! : null;
}
