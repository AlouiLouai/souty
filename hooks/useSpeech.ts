"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech() {
  const [enabled, setEnabled] = useState(true);
  const [supported, setSupported] = useState(false);
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" && "speechSynthesis" in window
    );
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !supported || !text) return;
      if (lastSpokenRef.current === text) return;
      lastSpokenRef.current = text;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    },
    [enabled, supported]
  );

  const resetLastSpoken = useCallback(() => {
    lastSpokenRef.current = "";
  }, []);

  return { enabled, setEnabled, supported, speak, resetLastSpoken };
}
