import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SIGNS, WORD_BY_LABEL } from "@souty/vocabulary";
import { clipForWord, pickArabicVoice, planSpeech, utteranceLang } from "./voice";
import { VOICE_CLIPS } from "./voiceClips";

const clips: Record<string, string> = { بلدية: "/audio/baladya.mp3", اليوم: "/audio/lyoum.mp3" };
const clipFor = (word: string) => clips[word] ?? null;

describe("FR-9 every word the app can say is a recording", () => {
  it("has a clip for each vocabulary word, so none falls back to the phone's voice", () => {
    for (const sign of SIGNS) expect(clipForWord(sign.word), `${sign.label} ${sign.word}`).not.toBeNull();
  });

  it("plays the sample sentence from recordings only", () => {
    const sentence = ["Open_Palm", "Pointing_Up", "Shaka_Sign", "Victory", "Thumb_Down", "Thumb_Up", "Three_Fingers", "OK_Sign", "Closed_Fist"].map(
      (label) => WORD_BY_LABEL[label]!
    );
    expect(planSpeech(sentence).map((segment) => segment.kind)).toEqual(["clips"]);
  });
});

describe("FR-9 text-to-speech voice choice", () => {
  const voice = (lang: string) => ({ lang });

  it("prefers a Tunisian voice, then any Arabic one, including iOS-style tags", () => {
    expect(pickArabicVoice([voice("en-US"), voice("ar-SA"), voice("ar-TN")])).toEqual(voice("ar-TN"));
    expect(pickArabicVoice([voice("en-US"), voice("ar_SA")])).toEqual(voice("ar_SA"));
    expect(pickArabicVoice([voice("fr-FR")])).toBeNull();
    expect(pickArabicVoice([])).toBeNull();
  });

  it("asks for a full Arabic language tag when no voice is chosen (iOS ignores bare \"ar\")", () => {
    expect(utteranceLang(null)).toBe("ar-SA");
    expect(utteranceLang(voice("ar-TN"))).toBe("ar-TN");
  });
});

describe("FR-9 Tunisian voice: recorded clips first, text-to-speech for the rest", () => {
  it("plays a fully recorded sentence as one run of clips", () => {
    expect(planSpeech(["اليوم", "بلدية"], clipFor)).toEqual([
      { kind: "clips", urls: ["/audio/lyoum.mp3", "/audio/baladya.mp3"], text: "اليوم بلدية" },
    ]);
  });

  it("reads consecutive words without a clip in one utterance, in sentence order", () => {
    expect(planSpeech(["نعاونك", "اليوم", "في", "سبيطار", "بلدية"], clipFor)).toEqual([
      { kind: "tts", text: "نعاونك" },
      { kind: "clips", urls: ["/audio/lyoum.mp3"], text: "اليوم" },
      { kind: "tts", text: "في سبيطار" },
      { kind: "clips", urls: ["/audio/baladya.mp3"], text: "بلدية" },
    ]);
  });

  it("falls back to text-to-speech entirely when nothing is recorded", () => {
    expect(planSpeech(["ايه", "لا"], () => null)).toEqual([{ kind: "tts", text: "ايه لا" }]);
    expect(planSpeech([], clipFor)).toEqual([]);
  });
});

describe("FR-9 recorded clips (lib/voiceClips.ts)", () => {
  const labels = new Set(SIGNS.map((sign) => sign.label));

  it("lists only vocabulary labels, each with a current file", () => {
    for (const [label, url] of Object.entries(VOICE_CLIPS)) {
      expect(labels.has(label), label).toBe(true);
      const [file, query] = url.split("?v=");
      expect(file, label).toBe(`/audio/${label}.mp3`);
      const bytes = readFileSync(new URL(`../public${file}`, import.meta.url));
      // A stale hash means the clip changed without `voice sync`: users would keep the old one.
      expect(createHash("sha256").update(bytes).digest("hex").slice(0, 10), label).toBe(query);
    }
  });
});
