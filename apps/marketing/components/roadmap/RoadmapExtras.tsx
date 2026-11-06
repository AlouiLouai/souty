import {
  Clapperboard,
  Database,
  Feather,
  GraduationCap,
  Landmark,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/content";
import { cn } from "@/lib/cn";

type Extras = Dictionary["roadmap"]["extras"];
type ExtraKey = keyof Extras;

interface ExtraStyle {
  Icon: LucideIcon;
  /** Background of the icon tile. */
  tile: string;
}

const extraStyles: Record<ExtraKey, ExtraStyle> = {
  studio: { Icon: Clapperboard, tile: "bg-sun" },
  institutions: { Icon: Landmark, tile: "bg-lilac" },
  emergency: { Icon: Siren, tile: "bg-pink" },
  learn: { Icon: GraduationCap, tile: "bg-mint" },
  lowEnd: { Icon: Feather, tile: "bg-sun" },
  openData: { Icon: Database, tile: "bg-lilac" },
};

const extraOrder = [
  "studio",
  "institutions",
  "emergency",
  "learn",
  "lowEnd",
  "openData",
] as const satisfies readonly ExtraKey[];

interface RoadmapExtrasProps {
  title: string;
  lead: string;
  extras: Extras;
  headingId: string;
}

/** Six further milestones the team believes in, shown as a grid of small cards. */
export function RoadmapExtras({ title, lead, extras, headingId }: RoadmapExtrasProps) {
  return (
    <div className="mt-20 sm:mt-24">
      <h3 id={headingId} className="text-center text-[clamp(1.6rem,3.8vw,2.25rem)] font-extrabold">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-[56ch] text-center text-[1.05rem] text-plum-soft">{lead}</p>

      <ul aria-labelledby={headingId} className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {extraOrder.map((key, index) => {
          const { Icon, tile } = extraStyles[key];
          const extra = extras[key];
          return (
            <li key={key}>
              <Reveal delay={(index % 3) * 90} className="h-full">
                <Card tone="sky" depth="sm" className="flex h-full items-start gap-4 p-5">
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-3 border-plum",
                      tile
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-[1.15rem] font-extrabold">{extra.title}</h4>
                    <p className="mt-1.5 text-[0.98rem] leading-normal text-plum-soft">{extra.body}</p>
                  </div>
                </Card>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
