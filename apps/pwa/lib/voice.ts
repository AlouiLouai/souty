/**
 * Tunisian voice for the sentence: recorded word clips first, the browser's
 * text-to-speech for any word without one.
 *
 * Browsers ship no Tunisian voice; an Arabic TTS voice reads Derja with a
 * Modern Standard Arabic accent. A short recording per word, made by a
 * Tunisian speaker, sounds right, weighs a few kilobytes, and works offline.
 * Clips are added with `pnpm --filter @souty/pwa voice <folder>` (see
 * scripts/voice.ts), which also regenerates `voiceClips.ts`.
 */
import { SIGNS } from "@souty/vocabulary";
import { VOICE_CLIPS } from "./voiceClips";

export const VOICE_DIR = "/audio";

/** Spoken word -> clip URL, for every word that has a recording. */
const CLIP_BY_WORD: ReadonlyMap<string, string> = new Map(
  SIGNS.flatMap((entry) => {
    const url = Object.prototype.hasOwnProperty.call(VOICE_CLIPS, entry.label) ? VOICE_CLIPS[entry.label] : undefined;
    return url ? [[entry.word, url] as const] : [];
  })
);

/** Clip URL for a displayed word, or null if it has no recording. */
export function clipForWord(word: string): string | null {
  return CLIP_BY_WORD.get(word) ?? null;
}

/** Every recorded clip, for warming the offline cache. */
export function allClips(): readonly string[] {
  return [...new Set(Object.values(VOICE_CLIPS))];
}

/** A voice's language tag, in lower case, for matching. */
const langOf = (voice: { lang: string }) => voice.lang.toLowerCase().replace("_", "-");

/** The best installed Arabic voice: Tunisian first, then any Arabic one. */
export function pickArabicVoice<T extends { lang: string }>(voices: readonly T[]): T | null {
  return voices.find((v) => langOf(v).startsWith("ar-tn")) ?? voices.find((v) => langOf(v).startsWith("ar")) ?? null;
}

/**
 * The language to ask for. A chosen voice dictates it. Without one, a full
 * tag: iOS WebKit (every iPhone browser, Chrome included) does not match the
 * bare "ar" and stays silent, while "ar-SA" finds its built-in Arabic voice.
 */
export function utteranceLang(voice: { lang: string } | null): string {
  return voice ? voice.lang : "ar-SA";
}

export type SpeechSegment =
  | { readonly kind: "clips"; readonly urls: readonly string[]; readonly text: string }
  | { readonly kind: "tts"; readonly text: string };

/**
 * Splits a sentence into runs of recorded words (played as clips) and runs
 * of words without a recording (read by one TTS utterance, so they keep a
 * natural flow instead of one robotic word at a time). Every segment keeps
 * its text, so a clip that fails to play can still be read.
 */
export function planSpeech(
  words: readonly string[],
  clipFor: (word: string) => string | null = clipForWord
): SpeechSegment[] {
  const segments: SpeechSegment[] = [];
  for (const word of words) {
    const url = clipFor(word);
    const last = segments[segments.length - 1];
    if (url) {
      if (last?.kind === "clips") {
        segments[segments.length - 1] = { kind: "clips", urls: [...last.urls, url], text: `${last.text} ${word}` };
      } else {
        segments.push({ kind: "clips", urls: [url], text: word });
      }
    } else if (last?.kind === "tts") {
      segments[segments.length - 1] = { kind: "tts", text: `${last.text} ${word}` };
    } else {
      segments.push({ kind: "tts", text: word });
    }
  }
  return segments;
}
