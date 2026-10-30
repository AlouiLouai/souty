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
  /** Rendered over the camera area (popups, tour spotlights). */
  scannerOverlay?: ReactNode;
  /** Rendered over the sentence panel (tour spotlights). */
  panelOverlay?: ReactNode;
}

// Camera feed + sentence panel, wired to a shared sentence and speech state.
export default function ScannerWorkspace({
  sentence,
  paused,
  onTogglePaused,
  onHandPresenceChange,
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
          onHandPresenceChange={onHandPresenceChange}
        />
        {scannerOverlay}
      </div>

      <div className="relative shrink-0">
        <TranslationPanel
          sentenceWords={sentence.words}
          speechSupported={speech.supported}
          paused={paused}
          onTogglePaused={onTogglePaused}
          onRemoveLastWord={sentence.removeLastWord}
          onClearSentence={sentence.clear}
          onSpeakSentence={speech.speak}
        />
        {panelOverlay}
      </div>
    </>
  );
}
