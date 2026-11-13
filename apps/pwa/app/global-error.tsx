"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import "@souty/brand/tokens.css";
import "./globals.css";

/** Announced to screen readers only. */
const SCREEN_READER_LABEL = "صار مشكل في التطبيق: عاود جرّب";

/**
 * Last-resort screen when the root layout itself fails (app/error.tsx
 * cannot render then). It replaces the whole document, so it brings its own
 * <html> and styles, and stays pictures only.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled root error", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
        <span role="status" className="sr-only">
          {SCREEN_READER_LABEL}
        </span>
        <div className="flex flex-col items-center gap-6 rounded-[1.5rem] border-2 border-border bg-card p-8">
          <TriangleAlert aria-hidden="true" className="h-14 w-14 text-destructive" strokeWidth={2} />
          <button
            type="button"
            onClick={reset}
            aria-label="عاود جرّب"
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground bg-primary text-primary-foreground"
          >
            <RotateCw className="h-7 w-7" strokeWidth={2.4} />
          </button>
        </div>
      </body>
    </html>
  );
}
