"use client";

import type { ReactNode } from "react";
import GestureScanner from "@/components/GestureScanner";
import TranslationPanel from "@/components/TranslationPanel";
import type { Sentence } from "@/hooks/useSentence";
import { useSpeech } from "@/hooks/useSpeech";

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
}: ScannerWorkspaceProps) {
  const speech = useSpeech();

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <GestureScanner
          className="h-full w-full"
          paused={paused}
          onLocked={sentence.addWord}
          onResume={onTogglePaused}
          onHandPresenceChange={onHandPresenceChange}
          onCameraSwitched={onCameraSwitched}
        />
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
