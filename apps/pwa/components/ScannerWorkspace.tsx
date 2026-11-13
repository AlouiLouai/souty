"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import GestureScanner from "@/components/GestureScanner";
import TranslationPanel from "@/components/TranslationPanel";
import { ValidatedMark, VoteButtons } from "@/components/VoteButtons";
import type { Sentence } from "@/hooks/useSentence";
import { useSpeech } from "@/hooks/useSpeech";
import { useVotes } from "@/hooks/useVotes";
import { isValidated } from "@/lib/validation";

/** How long the "is this word right?" buttons stay after a word is said. */
const FEEDBACK_MS = 6000;

interface ScannerWorkspaceProps {
  /** Owned by the caller so it can outlive this view. */
  sentence: Sentence;
  paused: boolean;
  onTogglePaused: () => void;
  onHandPresenceChange?: (present: boolean) => void;
  onCameraSwitched?: () => void;
  /** Fires when the user presses any sentence-panel button. */
  onPanelAction?: () => void;
  /** Rendered over the camera area (popups, tour spotlights). */
  scannerOverlay?: ReactNode;
  /** Rendered over the sentence panel (tour spotlights). */
  panelOverlay?: ReactNode;
  /** After a word is said, ask once whether it is the right word for the sign. */
  askFeedback?: boolean;
}

/** Camera feed plus sentence panel, wired to shared sentence and speech state. */
export default function ScannerWorkspace({
  sentence,
  paused,
  onTogglePaused,
  onHandPresenceChange,
  onCameraSwitched,
  onPanelAction,
  scannerOverlay,
  panelOverlay,
  askFeedback = false,
}: ScannerWorkspaceProps) {
  const speech = useSpeech();
  const votes = useVotes();
  /** The sign just said, while its word can be judged. */
  const [judged, setJudged] = useState<{ label: string; word: string } | null>(null);

  const { addWord } = sentence;
  const handleLocked = useCallback(
    (word: string, label: string) => {
      addWord(word);
      // Asked once per sign: a sign this device already judged is left alone.
      setJudged(askFeedback && votes.enabled && !votes.mine[label] ? { label, word } : null);
    },
    [addWord, askFeedback, votes.enabled, votes.mine]
  );

  useEffect(() => {
    if (!judged) return;
    const timer = setTimeout(() => setJudged(null), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [judged]);

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <GestureScanner
          className="h-full w-full"
          paused={paused}
          onLocked={handleLocked}
          onResume={onTogglePaused}
          onHandPresenceChange={onHandPresenceChange}
          onCameraSwitched={onCameraSwitched}
        />
        {judged && !paused && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div
              dir="rtl"
              className="pointer-events-auto flex animate-fade-in-up items-center gap-3 rounded-full border-2 border-foreground bg-card py-1.5 pl-2 pr-4 shadow-[0_4px_0_var(--foreground)]"
            >
              <span lang="ar" className="flex items-center gap-1 font-display text-xl font-extrabold text-foreground">
                {judged.word}
                {isValidated(votes.tallies[judged.label]) && <ValidatedMark className="h-6 w-6" />}
              </span>
              <VoteButtons label={judged.label} word={judged.word} mine={undefined} onVoted={() => setJudged(null)} />
            </div>
          </div>
        )}
        {scannerOverlay}
        {/* Screen readers hear each new word as it is added. */}
        <span role="status" className="sr-only">
          {sentence.words[sentence.words.length - 1] ?? ""}
        </span>
      </div>

      <div className="relative shrink-0">
        <TranslationPanel
          sentenceWords={sentence.words}
          speechSupported={speech.supported}
          speaking={speech.speaking}
          paused={paused}
          onTogglePaused={() => {
            onTogglePaused();
            onPanelAction?.();
          }}
          onRemoveLastWord={() => {
            sentence.removeLastWord();
            onPanelAction?.();
          }}
          onClearSentence={() => {
            sentence.clear();
            onPanelAction?.();
          }}
          onSpeakSentence={(words) => {
            speech.speak(words);
            onPanelAction?.();
          }}
          onSpeakWord={(word) => {
            speech.speak([word]);
            onPanelAction?.();
          }}
        />
        {panelOverlay}
      </div>
    </>
  );
}
