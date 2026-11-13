"use client";

import { Check, ScanLine } from "lucide-react";
import { TwoHands } from "@/components/Pictograms";
import { Button } from "@/components/ui/button";
import { StatusDialog } from "@/components/StatusDialog";

interface IdleExitPopupProps {
  onContinue: () => void;
}

/**
 * "Bring your hands into view", as a picture: two hands rising into the
 * camera frame. The parent hides it as soon as a hand reappears.
 */
export default function IdleExitPopup({ onContinue }: IdleExitPopupProps) {
  return (
    <StatusDialog
      className="z-40"
      ariaLabel="ما ثماش يد قدّام الكاميرا: حط يديك قدّامها باش تكمّل"
      icon={
        <span aria-hidden="true" className="relative flex h-28 w-28 items-center justify-center overflow-hidden">
          <ScanLine className="absolute inset-0 h-28 w-28 text-foreground/70" strokeWidth={1.4} />
          <span className="animate-rise">
            <TwoHands iconClassName="h-10 w-10 text-highlight" />
          </span>
        </span>
      }
      action={
        <Button onClick={onContinue} size="icon" className="h-16 w-16" aria-label="فهمت">
          <Check className="h-8 w-8" strokeWidth={3} />
        </Button>
      }
    />
  );
}
