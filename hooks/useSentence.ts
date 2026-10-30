"use client";

import { useCallback, useState } from "react";

/** Word list built up from locked-in gestures. */
export function useSentence() {
  const [words, setWords] = useState<string[]>([]);

  const addWord = useCallback((word: string) => {
    setWords((prev) => [...prev, word]);
  }, []);

  const removeLastWord = useCallback(() => {
    setWords((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => setWords([]), []);

  return { words, addWord, removeLastWord, clear };
}

export type Sentence = ReturnType<typeof useSentence>;
