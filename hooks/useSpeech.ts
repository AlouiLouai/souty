"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function pickArabicVoice(voices: SpeechSynthesisVoice[]) {
  const byPrefix = (prefix: string) =>
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  return byPrefix("ar-tn") ?? byPrefix("ar") ?? null;
}

export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSupported(true);

    const synth = window.speechSynthesis;
    const updateVoice = () => {
      voiceRef.current = pickArabicVoice(synth.getVoices());
    };

    updateVoice();
    synth.addEventListener("voiceschanged", updateVoice);
    return () => synth.removeEventListener("voiceschanged", updateVoice);
  }, []);

  // Reads text aloud, preferring an installed Arabic voice.
  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ar";
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.rate = 0.95;
        utterance.onerror = (event) => console.error("Speech synthesis error", event);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // Some browsers throw synchronously on edge cases (unsupported
        // voice/lang combination) - speech is non-essential, never crash.
        console.error("Failed to speak sentence", err);
      }
    },
    [supported]
  );

  return { supported, speak };
}
