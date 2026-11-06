import { Accessibility, Cpu, Gift, Hand, Languages, WifiOff, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/content";
import { cn } from "@/lib/cn";

type Features = Dictionary["product"]["features"];

interface FeatureStyle {
  key: keyof Features;
  Icon: LucideIcon;
  /** Background of the round icon badge. */
  badge: string;
  /** Sticker-like tilt from the sm breakpoint up; straightens on hover. */
  tilt: string;
}

const FEATURES: readonly FeatureStyle[] = [
  { key: "onDevice", Icon: Cpu, badge: "bg-sun", tilt: "sm:-rotate-1" },
  { key: "offline", Icon: WifiOff, badge: "bg-pink", tilt: "" },
  { key: "tunisian", Icon: Languages, badge: "bg-lilac", tilt: "sm:rotate-1" },
  { key: "twoHands", Icon: Hand, badge: "bg-mint", tilt: "sm:rotate-1" },
  { key: "accessible", Icon: Accessibility, badge: "bg-sun", tilt: "" },
  { key: "free", Icon: Gift, badge: "bg-pink", tilt: "sm:-rotate-1" },
];

interface FeatureGridProps {
  features: Features;
}

/** What the app does today: six cards, one per property that is already built. */
export function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {FEATURES.map(({ key, Icon, badge, tilt }, index) => (
        <li key={key}>
          <Reveal delay={(index % 3) * 90} className="h-full">
            <Card
              className={cn(
                "grid h-full content-start gap-3 p-6 transition-transform duration-300 hover:rotate-0",
                tilt
              )}
            >
              <span
                className={cn(
                  "grid size-14 place-items-center rounded-full border-3 border-plum shadow-hard-sm",
                  badge
                )}
              >
                <Icon aria-hidden="true" className="size-7" strokeWidth={2.25} />
              </span>
              <h3 className="text-[1.35rem] font-extrabold">{features[key].title}</h3>
              <p className="text-plum-soft">{features[key].body}</p>
            </Card>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
