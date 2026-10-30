"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDialog } from "@/components/StatusDialog";

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
    <main className="relative min-h-[100dvh] w-full bg-background">
      <StatusDialog
        className="bg-background backdrop-blur-none"
        icon={<AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />}
        title="حدث خطأ غير متوقع"
        message="صار مشكل في التطبيق. جرب من جديد، وإذا تكرر المشكل أعد فتح الصفحة."
        action={
          <Button onClick={reset} size="sm">
            إعادة المحاولة
          </Button>
        }
      />
    </main>
  );
}
