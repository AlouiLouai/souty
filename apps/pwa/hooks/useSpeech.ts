"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { allClips, pickArabicVoice, planSpeech, utteranceLang } from "@/lib/voice";

/** Silence between two recorded words, in milliseconds. */
const CLIP_GAP_MS = 60;

/** Time for a cancelled utterance to clear before the next one starts (iOS and Chrome drop it otherwise). */
const AFTER_CANCEL_MS = 80;

/** A clip that never reports its end is given up after this. */
const CLIP_TIMEOUT_MS = 8000;

/** 0.02 s of silence. Played inside a tap, it lets iOS start this element's later clips without another tap. */
const SILENCE =
  "data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

/**
 * One audio element for the whole app, played by the tap. iOS plays a media
 * element even with the silent switch on, but mutes Web Audio (and speech)
 * when it is on, which made the app silent on iPhones with the switch down.
 */
let sharedAudio: HTMLAudioElement | null = null;

/**
 * Clip URL -> object URL of its bytes. A blob URL needs no range requests,
 * which iOS makes for media and the service worker cannot answer.
 */
const clipUrls = new Map<string, Promise<string>>();

function loadClip(url: string): Promise<string> {
  let loaded = clipUrls.get(url);
  if (!loaded) {
    loaded = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${url}: ${res.status}`);
        return res.blob();
      })
      .then((blob) => URL.createObjectURL(blob));
    loaded.catch(() => clipUrls.delete(url)); // retry next time
    clipUrls.set(url, loaded);
  }
  return loaded;
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

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
  /** True when the last words got no sound at all (no usable voice, or the phone's mute): shown as a muted speaker. */
  const [failed, setFailed] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  /** Holds the live utterance: Chrome may drop an unreferenced one and never fire its end. */
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  /** Ends the clip being played, so a new request is not left waiting for it. */
  const cancelClipRef = useRef<(() => void) | null>(null);
  /** Bumped on every speak; a stale run stops at its next step. */
  const runRef = useRef(0);

  useEffect(() => {
    const hasTts = "speechSynthesis" in window;
    const clips = allClips();
    setSupported(hasTts || (clips.length > 0 && typeof Audio !== "undefined"));

    // Fetch every clip once: the service worker keeps them for offline use, and a tap then starts at once.
    const idle = window.setTimeout(() => {
      for (const url of clips) void loadClip(url).catch(() => {});
    }, 1500);

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
    cancelClipRef.current?.();
    sharedAudio?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /** Whether the speech engine still holds an utterance that a cancel has to clear first. */
  const engineBusy = () => {
    const synth = window.speechSynthesis;
    return synth.speaking || synth.pending;
  };

  /** Plays one clip on the shared element; resolves when it ends. */
  const playOnce = useCallback((audio: HTMLAudioElement, src: string) => {
    return new Promise<void>((resolve, reject) => {
      let timer = 0;
      const cleanup = () => {
        window.clearTimeout(timer);
        audio.onended = null;
        audio.onerror = null;
        if (cancelClipRef.current === finish) cancelClipRef.current = null;
      };
      const finish = () => {
        cleanup();
        resolve();
      };
      audio.onended = finish;
      audio.onerror = () => {
        cleanup();
        reject(new Error("audio element error"));
      };
      timer = window.setTimeout(finish, CLIP_TIMEOUT_MS);
      cancelClipRef.current = finish;
      audio.src = src;
      audio.play().catch((error) => {
        cleanup();
        reject(error);
      });
    });
  }, []);

  /** Plays clips back to back on the shared element. */
  const playClips = useCallback(
    async (urls: readonly string[], run: number) => {
      const audio = sharedAudio;
      if (!audio) throw new Error("no audio element");
      for (let i = 0; i < urls.length; i++) {
        if (run !== runRef.current) return;
        const src = await loadClip(urls[i]!);
        if (run !== runRef.current) return;
        await playOnce(audio, src);
        if (i < urls.length - 1 && run === runRef.current) await sleep(CLIP_GAP_MS);
      }
    },
    [playOnce]
  );

  const say = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      const synth = window.speechSynthesis;
      // The voice list can still be empty when the effect first ran (iOS fills it late).
      voiceRef.current ??= pickArabicVoice(synth.getVoices());
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = utteranceLang(voiceRef.current);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 0.95;
      let timer = 0;
      let started = false;
      const done = () => {
        window.clearTimeout(timer);
        if (utteranceRef.current === utterance) utteranceRef.current = null;
        // Finished without ever starting: the phone said nothing.
        if (!started) setFailed(true);
        resolve();
      };
      utterance.onstart = () => {
        started = true;
        setFailed(false);
      };
      utterance.onend = done;
      utterance.onerror = (event) => {
        console.error("Speech synthesis error", event);
        done();
      };
      timer = window.setTimeout(done, ttsTimeoutMs(text));
      utteranceRef.current = utterance;
      synth.resume(); // iOS can leave the engine paused after an earlier cancel
      synth.speak(utterance);
    });
  }, []);

  /** Reads the sentence aloud. Call it from the tap handler (browsers require a gesture for audio). */
  const speak = useCallback(
    (words: readonly string[]) => {
      if (!supported || words.length === 0) return;
      // Cancelling and speaking in the same instant drops the new speech on iOS and Chrome, so
      // wait a beat, but only when something was actually playing: a first tap stays inside its gesture.
      const wasBusy = "speechSynthesis" in window && engineBusy();
      stop();
      const run = runRef.current;
      const segments = planSpeech(words);

      // Start the shared element inside the tap, before any await: iOS then lets it play the clips that follow.
      if (segments.some((s) => s.kind === "clips") && typeof Audio !== "undefined") {
        sharedAudio ??= new Audio();
        sharedAudio.src = SILENCE;
        sharedAudio.play().catch(() => {});
      }

      setSpeaking(true);
      void (async () => {
        if (wasBusy) await sleep(AFTER_CANCEL_MS);
        for (const segment of segments) {
          if (run !== runRef.current) return;
          try {
            if (segment.kind === "clips") {
              await playClips(segment.urls, run);
            } else {
              await say(segment.text);
            }
          } catch (err) {
            // A clip that fails to load or play: read those words instead.
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

  return { supported, speaking, failed, speak };
}
