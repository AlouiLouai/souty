import { ArrowRight, Film, Handshake, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/content";
import { sectionIds } from "@/lib/site";

/** One icon per limit, in the order of `limits.items`: movement, then two hands. */
const LIMIT_ICONS: readonly LucideIcon[] = [Film, Handshake];

interface LimitsCardProps {
  limits: Dictionary["product"]["limits"];
}

/** The honest note: what today's model cannot do yet, and where that is planned. */
export function LimitsCard({ limits }: LimitsCardProps) {
  return (
    <Reveal>
      <Card tone="cream" depth="sm" className="mx-auto grid max-w-[880px] gap-6 p-6 sm:p-8">
        <div className="grid gap-1.5">
          <h3 className="text-[clamp(1.5rem,3.4vw,1.9rem)] font-extrabold">{limits.title}</h3>
          <p className="text-[1.1rem] text-plum-soft">{limits.lead}</p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {limits.items.map((item, index) => {
            const Icon = LIMIT_ICONS[index] ?? Film;
            return (
              <li
                key={item.title}
                className="flex items-start gap-3.5 rounded-2xl border-[2.5px] border-plum bg-paper p-4"
              >
                <span className="grid size-11 flex-none place-items-center rounded-full border-[2.5px] border-plum bg-sky">
                  <Icon aria-hidden="true" className="size-5" strokeWidth={2.25} />
                </span>
                <div className="grid min-w-0 gap-1">
                  <h4 className="text-[1.1rem] font-extrabold">{item.title}</h4>
                  <p className="text-[0.98rem] leading-normal text-plum-soft">{item.body}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{limits.next}</span>
          <a
            href={`#${sectionIds.roadmap}`}
            className="inline-flex min-h-11 items-center gap-1.5 font-display text-[1.1rem] font-bold text-plum underline decoration-harissa decoration-[3px] underline-offset-4"
          >
            {limits.nextLink}
            <ArrowRight aria-hidden="true" className="size-5 rtl:-scale-x-100" strokeWidth={2.75} />
          </a>
        </p>
      </Card>
    </Reveal>
  );
}
