"use client";

import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IdleExitPopupProps {
  onContinue: () => void;
}

// Purely informational - this never auto-closes anything, it just
// reminds the user to put their hand back in frame. Dismisses itself the
// moment a hand is seen again (see app/page.tsx), or via the button.
export default function IdleExitPopup({ onContinue }: IdleExitPopupProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-[1.5rem] border-2 border-border bg-card p-6 text-center shadow-[5px_5px_0_var(--border)]">
        <Hand className="mx-auto mb-3 h-8 w-8 text-foreground" />
        <p dir="rtl" className="font-display text-base font-bold text-foreground">
          ماكانش يد قدام الكاميرا
        </p>
        <p dir="rtl" className="mt-2 text-xs leading-relaxed text-muted-foreground">
          حط يدك قدام الكاميرا وأعمل إشارة باش تكمل
        </p>
        <Button onClick={onContinue} size="sm" className="mt-4">
          فهمت
        </Button>
      </div>
    </div>
  );
}
