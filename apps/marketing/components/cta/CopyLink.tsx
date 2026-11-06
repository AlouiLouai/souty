"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { confettiFrom } from "@/lib/confetti";

type CopyStatus = "idle" | "done" | "selected";

/** How long the "Copied" / "Selected" label stays before going back. */
const RESET_DELAY_MS = 1800;

interface CopyLinkProps {
  /** The full address put on the clipboard. */
  url: string;
  /** The address as people read it, without the protocol. */
  displayUrl: string;
  labels: Record<CopyStatus, string>;
}

/**
 * The app's address in a pill, with a button that copies it. Where the
 * clipboard is not available, the address is selected instead so the
 * visitor can copy it by hand.
 */
export function CopyLink({ url, displayUrl, labels }: CopyLinkProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const linkRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const resetTimer = useRef<number | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  function flash(next: Exclude<CopyStatus, "idle">) {
    // The clipboard answers asynchronously: the pill may be gone by then.
    if (!mounted.current) return;
    setStatus(next);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      setStatus("idle");
    }, RESET_DELAY_MS);
  }

  function selectLink() {
    const link = linkRef.current;
    const selection = window.getSelection();
    if (link && selection) {
      const range = document.createRange();
      range.selectNodeContents(link);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    flash("selected");
  }

  function celebrateCopy() {
    flash("done");
    if (mounted.current && buttonRef.current) confettiFrom(buttonRef.current, 30);
  }

  function handleCopy() {
    try {
      // Rejects without permission; throws where the API is missing (http).
      navigator.clipboard.writeText(url).then(celebrateCopy, selectLink);
    } catch {
      selectLink();
    }
  }

  const Icon = status === "done" ? Check : Copy;

  return (
    <div className="inline-flex max-w-full items-center gap-2.5 rounded-[2rem] border-3 border-plum bg-paper py-1.5 pe-1.5 ps-4 font-semibold text-plum shadow-[4px_4px_0_var(--plum)]">
      <span
        ref={linkRef}
        dir="ltr"
        className="min-w-0 select-all break-all text-[0.95rem] leading-snug sm:text-base"
      >
        {displayUrl}
      </span>
      <Button
        ref={buttonRef}
        variant="sun"
        size="sm"
        onClick={handleCopy}
        className="shrink-0 whitespace-nowrap px-3.5 sm:px-4"
      >
        {/* The narrowest phones keep the room for the address. */}
        <Icon aria-hidden="true" className="size-[1.1rem] max-[399px]:hidden" strokeWidth={2.75} />
        {labels[status]}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : labels[status]}
      </span>
    </div>
  );
}
