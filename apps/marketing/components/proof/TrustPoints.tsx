import { Database, Scale, ScanSearch, Smartphone, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/content";
import { cn } from "@/lib/cn";

type TrustPoints = Dictionary["proof"]["points"];
type TrustPointKey = keyof TrustPoints;

interface PointStyle {
  Icon: LucideIcon;
  /** Background of the icon tile. */
  tile: string;
  /** Resting tilt of the card; it straightens on hover. */
  tilt: string;
}

const pointStyles: Record<TrustPointKey, PointStyle> = {
  product: { Icon: Smartphone, tile: "bg-sun", tilt: "-rotate-1" },
  honest: { Icon: ScanSearch, tile: "bg-mint", tilt: "rotate-1" },
  results: { Icon: Scale, tile: "bg-lilac", tilt: "-rotate-1" },
  data: { Icon: Database, tile: "bg-pink", tilt: "rotate-1" },
};

const pointOrder = ["product", "honest", "results", "data"] as const satisfies readonly TrustPointKey[];

interface TrustPointsProps {
  points: TrustPoints;
  /** Id of the heading that names this list. */
  labelledBy: string;
}

/** Four cards, each giving one checkable reason to trust what the page shows. */
export function TrustPoints({ points, labelledBy }: TrustPointsProps) {
  return (
    <ul aria-labelledby={labelledBy} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {pointOrder.map((key, index) => {
        const { Icon, tile, tilt } = pointStyles[key];
        const point = points[key];
        return (
          <li key={key}>
            <Reveal delay={index * 90} className="h-full">
              <Card className={cn("h-full p-5 transition-transform duration-200 hover:rotate-0", tilt)}>
                <span
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-2xl border-3 border-plum shadow-hard-sm",
                    tile
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <h4 className="mt-4 text-[1.25rem] font-extrabold">{point.title}</h4>
                <p className="mt-2 text-[1rem] text-plum-soft">{point.body}</p>
              </Card>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
