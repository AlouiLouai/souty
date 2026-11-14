import { describe, expect, it } from "vitest";
import { SIGNS } from "@souty/vocabulary";
import { DEMO_PHRASES } from "../lib/demoScript";
import { VOICED } from "./voiceText";

/** Removes the short vowels and folds letter variants, leaving the plain spelling. */
const plain = (text: string) =>
  text
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي");

const ENTRIES = [...SIGNS, ...DEMO_PHRASES];

describe("FR-9 voice text: how each word is pronounced when a voice is generated", () => {
  it("names a pronunciation for every word, and only for real labels", () => {
    const labels = new Set(ENTRIES.map((entry) => entry.label));
    // A word several signs share (ايه, لا, عسلامة) is recorded once, under its first label.
    const firstOfWord = new Map<string, string>();
    for (const entry of ENTRIES) if (!firstOfWord.has(entry.word)) firstOfWord.set(entry.word, entry.label);
    for (const label of firstOfWord.values()) expect(VOICED[label], label).toBeTruthy();
    for (const label of Object.keys(VOICED)) expect(labels.has(label), label).toBe(true);
  });

  it("only adds vowel marks to the word the app shows", () => {
    for (const entry of ENTRIES) {
      const voiced = VOICED[entry.label];
      if (!voiced || /^\d+$/.test(entry.word)) continue; // digits are spoken as a number word
      expect(plain(voiced), `${entry.label}: ${voiced}`).toBe(plain(entry.word));
    }
  });
});
