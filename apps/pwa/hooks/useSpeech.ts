"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { allClips, planSpeech } from "@/lib/voice";

/** Silence between two recorded words, in seconds. */
const CLIP_GAP_S = 0.08;

function pickArabicVoice(voices: SpeechSynthesisVoice[]) {
  const byPrefix = (prefix: string) =>
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  return byPrefix("ar-tn") ?? byPrefix("ar") ?? null;
}

type AudioContextClass = typeof AudioContext;

function audioContextClass(): AudioContextClass | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext ?? null;
}

/**
 * One audio context and one clip cache for the whole app: the scanner and
 * the sign guide each use this hook, and browsers cap live contexts.
 */
let sharedContext: AudioContext | null = null;
const sharedBuffers = new Map<string, Promise<AudioBuffer>>();

/** A text-to-speech utterance that never reports its end is given up after this. */
function ttsTimeoutMs(text: string) {
  return 3000 + text.length * 250;
}

/**
 * Speaks the sentence: recorded Tunisian word clips where they exist
 * (lib/voice.ts), the browser's Arabic text-to-speech for the other words.
 */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  /** True while a sentence or word is being played, for the speaking animation. */
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  /** Holds the live utterance: Chrome may drop an unreferenced one and never fire its end. */
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  /** Bumped on every speak; a stale run stops at its next step. */
  const runRef = useRef(0);

  useEffect(() => {
    const hasTts = "speechSynthesis" in window;
    const clips = allClips();
    setSupported(hasTts || (clips.length > 0 && audioContextClass() !== null));

    // Fetch every clip once, so the service worker keeps them for offline use.
    const idle = window.setTimeout(() => {
      for (const url of clips) void fetch(url).catch(() => {});
    }, 3000);

    if (!hasTts) return () => window.clearTimeout(idle);
    const synth = window.speechSynthesis;
    const updateVoice = () => {
      voiceRef.current = pickArabicVoice(synth.getVoices());
    };
    updateVoice();
    synth.addEventListener("voiceschanged", updateVoice);
    return () => {
      window.clearTimeout(idle);
      synth.removeEventListener("voiceschanged", updateVoice);
    };
  }, []);

  const stop = useCallback(() => {
    runRef.current++;
    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    sourcesRef.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const decode = useCallback((context: AudioContext, url: string) => {
    let buffer = sharedBuffers.get(url);
    if (!buffer) {
      buffer = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`${url}: ${res.status}`);
          return res.arrayBuffer();
        })
        .then((bytes) => context.decodeAudioData(bytes));
      buffer.catch(() => sharedBuffers.delete(url)); // retry next time
      sharedBuffers.set(url, buffer);
    }
    return buffer;
  }, []);

  /** Plays clips back to back; resolves when the last one ends. */
  const playClips = useCallback(
    async (context: AudioContext, urls: readonly string[], run: number) => {
      const buffers = await Promise.all(urls.map((url) => decode(context, url)));
      if (run !== runRef.current) return;
      let at = context.currentTime + 0.02;
      const ended: Promise<void>[] = [];
      for (const buffer of buffers) {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(at);
        sourcesRef.current.push(source);
        ended.push(new Promise((resolve) => (source.onended = () => resolve())));
        at += buffer.duration + CLIP_GAP_S;
      }
      // Never wait forever on an "ended" event that does not come.
      const total = at - context.currentTime;
      await Promise.race([
        Promise.all(ended),
        new Promise<void>((resolve) => window.setTimeout(resolve, (total + 1) * 1000)),
      ]);
    },
    [decode]
  );

  const say = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar";
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 0.95;
      let timer = 0;
      const done = () => {
        window.clearTimeout(timer);
        if (utteranceRef.current === utterance) utteranceRef.current = null;
        resolve();
      };
      utterance.onend = done;
      utterance.onerror = (event) => {
        console.error("Speech synthesis error", event);
        done();
      };
      timer = window.setTimeout(done, ttsTimeoutMs(text));
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  /** Reads the sentence aloud. Call it from the tap handler (browsers require a gesture for audio). */
  const speak = useCallback(
    (words: readonly string[]) => {
      if (!supported || words.length === 0) return;
      stop();
      const run = runRef.current;
      const segments = planSpeech(words);

      // Create or resume the audio context inside the gesture, before any await.
      const Context = audioContextClass();
      if (Context && segments.some((s) => s.kind === "clips")) {
        sharedContext ??= new Context();
        void sharedContext.resume();
      }

      setSpeaking(true);
      void (async () => {
        for (const segment of segments) {
          if (run !== runRef.current) return;
          try {
            if (segment.kind === "clips" && sharedContext) {
              await playClips(sharedContext, segment.urls, run);
            } else {
              await say(segment.text);
            }
          } catch (err) {
            // A clip that fails to load or decode: read those words instead.
            console.error("Voice clip failed, using text-to-speech", err);
            if (run === runRef.current) await say(segment.text);
          }
        }
        if (run === runRef.current) setSpeaking(false);
      })();
    },
    [playClips, say, stop, supported]
  );

  useEffect(() => stop, [stop]);

  return { supported, speaking, speak };
}
