"use client";

import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDialog } from "@/components/StatusDialog";

interface IdleExitPopupProps {
  onContinue: () => void;
}

// Purely informational reminder: never closes anything on its own. The
// parent hides it as soon as a hand reappears, or via the button.
export default function IdleExitPopup({ onContinue }: IdleExitPopupProps) {
  return (
    <StatusDialog
      className="z-40"
      icon={<Hand className="mx-auto mb-3 h-8 w-8 text-foreground" />}
      title="ماكانش يد قدام الكاميرا"
      message="حط يدك قدام الكاميرا وأعمل إشارة باش تكمل"
      action={
        <Button onClick={onContinue} size="sm">
          فهمت
        </Button>
      }
    />
  );
}
