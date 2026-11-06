import { FlaskConical, Landmark, Video, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/content";
import { cn } from "@/lib/cn";

interface SupportVisual {
  Icon: LucideIcon;
  tone: ComponentProps<typeof Card>["tone"];
  tilt: string;
}

/**
 * Icon, card tone and tilt for each support item, in dictionary order:
 * recording with the community, pilots in public services, research.
 */
const VISUALS: readonly SupportVisual[] = [
  { Icon: Video, tone: "mint", tilt: "-rotate-1" },
  { Icon: Landmark, tone: "cream", tilt: "rotate-1" },
  { Icon: FlaskConical, tone: "lilac", tilt: "-rotate-1" },
];

const FALLBACK_VISUAL: SupportVisual = { Icon: Video, tone: "paper", tilt: "" };

/**
 * "What your support makes possible": three cards telling funders where
 * their support goes (community recording, pilots and research).
 */
export function SupportList({ copy }: { copy: Dictionary["cta"]["support"] }) {
  return (
    <div className="mt-16 sm:mt-20">
      <div className="mb-8 grid justify-items-center gap-3 text-center sm:mb-10">
        <h3 className="text-[clamp(1.6rem,3.6vw,2.2rem)] font-extrabold">{copy.title}</h3>
        <p className="max-w-[56ch] text-[1.1rem] text-plum-soft">{copy.lead}</p>
      </div>
      <ul className="grid gap-6 md:grid-cols-3">
        {copy.items.map((item, index) => {
          const { Icon, tone, tilt } = VISUALS[index] ?? FALLBACK_VISUAL;
          return (
            <li key={item.title}>
              <Reveal delay={index * 100} className="h-full">
                <Card
                  tone={tone}
                  className={cn(
                    "grid h-full content-start gap-3 p-6 transition-transform duration-200 hover:rotate-0",
                    tilt
                  )}
                >
                  <span className="grid size-14 place-items-center rounded-2xl border-3 border-plum bg-paper shadow-hard-sm">
                    <Icon aria-hidden="true" className="size-7" strokeWidth={2.5} />
                  </span>
                  <h4 className="text-[1.3rem] font-extrabold">{item.title}</h4>
                  <p className="text-plum-soft">{item.body}</p>
                </Card>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
