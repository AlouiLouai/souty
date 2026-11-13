import Link from "next/link";
import { House, SearchX } from "lucide-react";
import { StatusDialog } from "@/components/StatusDialog";

/** Unknown address: a picture and a home button, instead of Next's English 404 text. */
export default function NotFound() {
  return (
    <main className="relative min-h-[100dvh] w-full bg-background">
      <StatusDialog
        className="bg-background"
        ariaLabel="الصفحة هاذي ما ثماش: ارجع للصفحة الرئيسية"
        icon={<SearchX aria-hidden="true" className="h-14 w-14 text-destructive" strokeWidth={2} />}
        action={
          <Link
            href="/"
            aria-label="ارجع للصفحة الرئيسية"
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground bg-primary text-primary-foreground shadow-[0_4px_0_var(--foreground)] active:translate-y-0.5"
          >
            <House className="h-7 w-7" strokeWidth={2.4} />
          </Link>
        }
      />
    </main>
  );
}
