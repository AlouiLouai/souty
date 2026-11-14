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
 * Turned on and off with the demo button on the landing screen (remembered
 * on the device). Outside the demo the vocabulary is untouched.
 */

/**
 * Model label -> word spoken in the demo.
 *
 * One-handed gestures only: they are the classes the model reads reliably
 * on a live camera. The two-handed TunSL signs were trained on still
 * photos and do not lock dependably in front of a phone.
 */
export const DEMO_WORDS: Readonly<Record<string, string>> = {
  // Open hand: a greeting. The real TunSL hello gives the same word.
  Open_Palm: "مرحباً",
  "3aslema": "مرحباً",
  // One raised index finger.
  Pointing_Up: "أنا",
  // A name sign is personal by nature; this one is Jawher's for the demo.
  Shaka_Sign: "جوهر",
  // Two fingers as scissors.
  Victory: "حلاق",
  // Thumb pointing down, "from here". Sign languages rarely sign "from" apart.
  Thumb_Down: "من سيدي بوزيد",
  // Thumb up: I like, I want. The real TunSL "want" gives the same word.
  Thumb_Up: "نحب",
  t7eb: "نحب",
  // Three fingers opening out.
  Three_Fingers: "نحل",
  // The OK ring: an approval, a permit.
  OK_Sign: "باتيندة",
  // A fist: on my own strength.
  Closed_Fist: "مبادر ذاتي",
};

/**
 * The words the demo speaks, each with the name its voice recording goes by
 * (`public/audio/<label>.mp3`, see scripts/voice.ts). They are not in the
 * vocabulary, so the recording tool needs this list.
 */
export const DEMO_PHRASES = [
  { label: "demo-marhba", word: "مرحباً", gloss: "hello" },
  { label: "demo-ana", word: "أنا", gloss: "I, me" },
  { label: "demo-jawher", word: "جوهر", gloss: "Jawher (a name)" },
  { label: "demo-7alle9", word: "حلاق", gloss: "barber" },
  { label: "demo-sidi-bouzid", word: "من سيدي بوزيد", gloss: "from Sidi Bouzid" },
  { label: "demo-n7eb", word: "نحب", gloss: "I want" },
  { label: "demo-n7el", word: "نحل", gloss: "I open" },
  { label: "demo-patinda", word: "باتيندة", gloss: "business licence" },
  { label: "demo-moubader", word: "مبادر ذاتي", gloss: "self-employed" },
] as const;

const STORAGE_KEY = "souty.demo";

let active = false;
let loaded = false;
const listeners = new Set<() => void>();

/** Reads the saved choice once, on the first use in the browser. */
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    active = window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    // Storage blocked (private mode): the choice lasts for this visit only.
  }
}

/** Whether the demo script is on for this device. Always false on the server. */
export function isDemoActive(): boolean {
  load();
  return active;
}

/** Turns the demo script on or off, and remembers the choice on this device. */
export function setDemoActive(on: boolean) {
  load();
  active = on;
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, "on");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: not remembered.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** The demo word for a model label, or null outside the demo. */
export function demoWord(label: string): string | null {
  if (!isDemoActive()) return null;
  return Object.prototype.hasOwnProperty.call(DEMO_WORDS, label) ? DEMO_WORDS[label]! : null;
}
