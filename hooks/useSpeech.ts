"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const arabicVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(isSupported);
    if (!isSupported) return;

    const pickArabicVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      arabicVoiceRef.current =
        voices.find((v) => v.lang.toLowerCase().startsWith("ar-tn")) ??
        voices.find((v) => v.lang.toLowerCase().startsWith("ar")) ??
        null;
    };

    pickArabicVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickArabicVoice);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", pickArabicVoice);
  }, []);

  // Reads a full block of text (e.g. the whole built sentence) aloud on
  // demand, using an installed Arabic voice when one is available.
  const speakSentence = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ar";
        if (arabicVoiceRef.current) utterance.voice = arabicVoiceRef.current;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onerror = (event) => {
          console.error("Speech synthesis error", event);
        };
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // Some browsers throw synchronously for edge cases (e.g. an
        // unsupported voice/lang combination) - never let this crash the
        // app over what's a non-essential feature.
        console.error("Failed to speak sentence", err);
      }
    },
    [supported]
  );

  return { supported, speakSentence };
}
