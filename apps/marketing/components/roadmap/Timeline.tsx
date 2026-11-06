import { Check, Hammer, MapPin, Sprout, Star, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Sticker } from "@/components/ui/Sticker";
import type { Dictionary } from "@/content";
import type { MilestoneStatus } from "@/content/shared";
import { cn } from "@/lib/cn";

type RoadmapCopy = Dictionary["roadmap"];
type Milestone = RoadmapCopy["milestones"][number];

interface StatusStyle {
  /** Tone of the status badge. */
  badge: "mint" | "sun" | "lilac" | "pink";
  /** Tone of the milestone card. */
  card: "mint" | "paper" | "sun";
  /** Fill of the timeline node and of the list bullets. */
  fill: string;
  /** Icon inside the timeline node. */
  Icon: LucideIcon;
}

const statusStyles: Record<MilestoneStatus, StatusStyle> = {
  shipped: { badge: "mint", card: "mint", fill: "bg-mint", Icon: Check },
  next: { badge: "sun", card: "paper", fill: "bg-sun", Icon: Hammer },
  later: { badge: "lilac", card: "paper", fill: "bg-lilac", Icon: Sprout },
  vision: { badge: "pink", card: "sun", fill: "bg-pink", Icon: Star },
};

/**
 * Where a milestone sits on wide screens: on the start or end side of the
 * centre line, or centred under it (the destination).
 */
type Placement = "start" | "end" | "centre";

interface PlacementLayout {
  /** The list item: half the width on one side, or the full width. */
  item: string;
  /** The node, pinned to the centre line. */
  node: string;
  /** The connector line, pinned to the centre line. */
  line: string;
}

const placements: Record<Placement, PlacementLayout> = {
  start: {
    item: "lg:w-1/2 lg:pe-10 lg:ps-0",
    node: "lg:-end-5 lg:start-auto",
    line: "lg:before:end-[-1.5px] lg:before:start-auto",
  },
  end: {
    item: "lg:ms-auto lg:w-1/2 lg:ps-10",
    node: "lg:-start-5",
    line: "lg:before:start-[-1.5px]",
  },
  centre: {
    item: "lg:ps-0 lg:pt-24",
    node: "lg:start-[calc(50%-20px)]",
    line: "lg:before:start-[calc(50%-1.5px)]",
  },
};

/** The ink line that joins one node to the next. Drawn per item so it starts and ends on a node. */
const connectorBase =
  "before:absolute before:start-[16.5px] before:w-[3px] before:rounded-full before:bg-plum before:content-['']";

function connectorSpan(isFirst: boolean, isLast: boolean): string {
  // The last item only needs the stub that reaches its own node (and, on wide
  // screens, runs on behind the node down to the destination card).
  if (isLast) return "before:top-0 before:h-5 lg:before:h-24";
  return cn(isFirst ? "before:top-5" : "before:top-0", "before:-bottom-8 lg:before:bottom-0");
}

interface MilestoneCardProps {
  milestone: Milestone;
  statusLabel: string;
  nowLabel: string;
  /** The final milestone: where the whole roadmap leads. */
  isDestination: boolean;
}

function MilestoneCard({ milestone, statusLabel, nowLabel, isDestination }: MilestoneCardProps) {
  const style = statusStyles[milestone.status];
  const isShipped = milestone.status === "shipped";

  return (
    <Card
      tone={style.card}
      depth={isDestination ? "lg" : "md"}
      className={cn("relative p-5 sm:p-6", isDestination && "sm:p-8")}
    >
      {isShipped ? (
        <Sticker tone="sun" tilt="right" className="absolute -top-4 end-4">
          <MapPin className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          {nowLabel}
        </Sticker>
      ) : null}
      {isDestination ? (
        <>
          <Star
            className="absolute -top-6 end-6 h-11 w-11 animate-wobble fill-paper text-plum"
            strokeWidth={2.25}
            aria-hidden="true"
          />
          <Star
            className="absolute -bottom-4 -end-3 h-7 w-7 animate-heartbeat fill-pink text-plum"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </>
      ) : null}

      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", isShipped && "pt-3")}>
        <Sticker tone={style.badge} tilt="none">
          {isShipped ? <Check className="h-4 w-4" strokeWidth={3.5} aria-hidden="true" /> : null}
          {statusLabel}
        </Sticker>
        <p className="font-display text-[1rem] font-bold text-plum-soft">{milestone.horizon}</p>
      </div>

      <h3
        className={cn(
          "mt-3.5 font-extrabold",
          isDestination ? "text-[clamp(1.6rem,3.4vw,2.1rem)]" : "text-[1.3rem] sm:text-[1.45rem]"
        )}
      >
        {milestone.title}
      </h3>
      <p className="mt-2 text-plum-soft">{milestone.body}</p>

      <ul className="mt-4 grid gap-2 text-[0.98rem] font-medium leading-snug">
        {milestone.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5">
            {isShipped ? (
              <Check className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0" strokeWidth={3.5} aria-hidden="true" />
            ) : (
              <span
                className={cn("mt-[0.3rem] h-3 w-3 shrink-0 rounded-full border-2 border-plum", style.fill)}
                aria-hidden="true"
              />
            )}
            <span className="min-w-0 break-words">{point}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

interface TimelineProps {
  milestones: RoadmapCopy["milestones"];
  statusLabels: RoadmapCopy["statusLabels"];
  nowLabel: string;
  /** Id of the heading that names the timeline. */
  labelledBy: string;
}

/**
 * The roadmap as a vertical timeline: one node and one card per milestone,
 * from what is shipped today down to the final goal.
 *
 * On phones the line runs down the start edge. From `lg` up it runs down the
 * centre with cards alternating on both sides and overlapping a little in
 * height, and the last milestone sits centred under the line as the
 * destination.
 */
export function Timeline({ milestones, statusLabels, nowLabel, labelledBy }: TimelineProps) {
  const lastIndex = milestones.length - 1;

  return (
    <ol aria-labelledby={labelledBy} className="grid gap-8 lg:gap-0">
      {milestones.map((milestone, index) => {
        const isFirst = index === 0;
        const isLast = index === lastIndex;
        const placement: Placement = isLast ? "centre" : index % 2 === 0 ? "start" : "end";
        const layout = placements[placement];
        const { fill, Icon } = statusStyles[milestone.status];

        return (
          <li
            key={milestone.title}
            className={cn(
              "relative ps-12 sm:ps-14",
              connectorBase,
              connectorSpan(isFirst, isLast),
              layout.item,
              layout.line,
              // Side cards interlock: each one starts before the previous one ends.
              !isFirst && !isLast && "lg:-mt-20"
            )}
          >
            <span
              className={cn(
                "absolute start-0 top-5 grid h-9 w-9 place-items-center rounded-full border-3 border-plum shadow-hard-sm lg:h-10 lg:w-10",
                layout.node,
                fill
              )}
              aria-hidden="true"
            >
              <Icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={3} />
            </span>
            <Reveal delay={60} className={cn(isLast && "lg:mx-auto lg:max-w-[42rem]")}>
              <MilestoneCard
                milestone={milestone}
                statusLabel={statusLabels[milestone.status]}
                nowLabel={nowLabel}
                isDestination={isLast}
              />
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
