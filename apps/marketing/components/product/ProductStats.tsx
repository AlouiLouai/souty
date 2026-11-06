import type { ComponentProps } from "react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/content";

type CardTone = NonNullable<ComponentProps<typeof Card>["tone"]>;

const TONES: readonly CardTone[] = ["cream", "mint", "lilac", "pink"];

interface ProductStatsProps {
  stats: Dictionary["product"]["stats"];
}

/** The headline numbers of the working app, as a row of big-figure cards. */
export function ProductStats({ stats }: ProductStatsProps) {
  return (
    <Reveal>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {stats.map((stat, index) => (
          <Card
            key={stat.label}
            tone={TONES[index % TONES.length] ?? "cream"}
            depth="sm"
            className="flex flex-col-reverse justify-end gap-2 px-3 py-5 text-center sm:px-5 sm:py-6"
          >
            <dt className="text-[0.95rem] font-medium leading-snug sm:text-base">{stat.label}</dt>
            <dd className="whitespace-nowrap font-display text-[clamp(2.25rem,7vw,3.5rem)] font-extrabold leading-none">
              {stat.value}
            </dd>
          </Card>
        ))}
      </dl>
    </Reveal>
  );
}
