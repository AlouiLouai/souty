import { Info } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Sticker } from "@/components/ui/Sticker";
import type { Dictionary } from "@/content";
import type { PackStage } from "@/content/shared";
import { cn } from "@/lib/cn";

type VisionCopy = Dictionary["vision"];

const stageOrder = ["live", "maghreb", "mena", "world"] as const satisfies readonly PackStage[];

/** Chip colour per stage. The dots on the globe use the same colours. */
const stageTones: Record<PackStage, "mint" | "sun" | "lilac" | "paper"> = {
  live: "mint",
  maghreb: "sun",
  mena: "lilac",
  world: "paper",
};

/** A small dot with an expanding ring: "this one is live". */
function LiveDot() {
  return (
    <span
      className="relative h-2.5 w-2.5 shrink-0 rounded-full bg-plum before:absolute before:inset-0 before:animate-pulse-ring before:rounded-full before:bg-plum before:content-['']"
      aria-hidden="true"
    />
  );
}

interface LanguagePacksProps {
  packs: VisionCopy["packs"];
  stageLabels: VisionCopy["stageLabels"];
  morePacks: string;
  note: string;
  /** Prefix for the ids that tie each stage label to its list. */
  idPrefix: string;
}

/**
 * The sign-language packs grouped by rollout stage: the one that is live
 * today, then the Maghreb, the Middle East and the rest of the world. A note
 * underneath states plainly that only the first group exists today.
 */
export function LanguagePacks({ packs, stageLabels, morePacks, note, idPrefix }: LanguagePacksProps) {
  return (
    <div className="grid gap-7">
      {stageOrder.map((stage, index) => {
        const labelId = `${idPrefix}-${stage}`;
        const isLive = stage === "live";
        return (
          <Reveal key={stage} delay={index * 90}>
            <h3 id={labelId} className="text-[1.2rem] font-extrabold sm:text-[1.3rem]">
              {stageLabels[stage]}
            </h3>
            <ul aria-labelledby={labelId} className="mt-3 flex flex-wrap gap-x-2.5 gap-y-3">
              {packs
                .filter((pack) => pack.stage === stage)
                .map((pack) => (
                  <li key={pack.name} className="max-w-full">
                    <Sticker
                      tone={stageTones[stage]}
                      tilt="none"
                      className={cn(
                        "max-w-full whitespace-normal text-start",
                        isLive && "gap-2.5 px-4 py-2 text-[1.05rem]"
                      )}
                    >
                      {isLive ? <LiveDot /> : null}
                      {pack.name}
                    </Sticker>
                  </li>
                ))}
              {stage === "world" ? (
                <li className="max-w-full">
                  <span className="inline-flex items-center rounded-full border-[2.5px] border-dashed border-plum px-3.5 py-1.5 font-display text-[0.92rem] font-bold leading-tight text-plum">
                    {morePacks}
                  </span>
                </li>
              ) : null}
            </ul>
          </Reveal>
        );
      })}

      <p className="flex items-start gap-2.5 text-[0.98rem] leading-normal text-plum-soft">
        <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <span>{note}</span>
      </p>
    </div>
  );
}
