"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <p dir="rtl" className="text-sm font-semibold text-foreground">
          حدث خطأ غير متوقع
        </p>
        <p dir="rtl" className="mt-2 text-xs leading-relaxed text-muted-foreground">
          صار مشكل في التطبيق. جرب من جديد، وإذا تكرر المشكل أعد فتح الصفحة.
        </p>
        <Button onClick={reset} size="sm" className="mt-4">
          إعادة المحاولة
        </Button>
      </div>
    </main>
  );
}
