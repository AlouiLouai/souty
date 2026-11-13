"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
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
        className="bg-background"
        ariaLabel="صار مشكل في التطبيق: عاود جرّب"
        icon={<TriangleAlert aria-hidden="true" className="h-14 w-14 text-destructive" strokeWidth={2} />}
        action={
          <Button onClick={reset} size="icon" className="h-16 w-16" aria-label="عاود جرّب">
            <RotateCw className="h-7 w-7" strokeWidth={2.4} />
          </Button>
        }
      />
    </main>
  );
}
