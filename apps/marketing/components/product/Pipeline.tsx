import { ArrowRight, BrainCircuit, Camera, Hand, Timer, Volume2, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Sticker } from "@/components/ui/Sticker";
import type { Dictionary } from "@/content";

const TECH_LABEL_ID = "product-tech-label";

/** One icon per step, in the order of `pipeline.steps`. */
const STEP_ICONS: readonly LucideIcon[] = [Camera, Hand, BrainCircuit, Timer, Volume2];

interface PipelineProps {
  pipeline: Dictionary["product"]["pipeline"];
}

/**
 * How a sign becomes a spoken word: five numbered steps (a row on large
 * screens, a column on phones) and the technology behind them.
 */
export function Pipeline({ pipeline }: PipelineProps) {
  const lastStep = pipeline.steps.length - 1;

  return (
    <div>
      <h3 className="mx-auto max-w-[24ch] text-center text-[clamp(1.6rem,3.8vw,2.25rem)] font-extrabold">
        {pipeline.title}
      </h3>

      <ol className="mt-8 grid gap-9 sm:mt-10 lg:grid-cols-5 lg:gap-7">
        {pipeline.steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Camera;
          return (
            <li key={step.title} className="relative">
              <Reveal delay={index * 80} className="h-full">
                <Card
                  depth="sm"
                  className="flex h-full items-start gap-4 p-4 lg:flex-col lg:items-center lg:px-3.5 lg:py-5 lg:text-center"
                >
                  <span className="relative grid size-14 flex-none place-items-center rounded-full border-3 border-plum bg-sun">
                    <Icon aria-hidden="true" className="size-7" strokeWidth={2.25} />
                    <span className="absolute -start-2 -top-2 grid size-7 place-items-center rounded-full bg-plum font-display text-[0.95rem] font-bold leading-none text-white">
                      {index + 1}
                    </span>
                  </span>
                  <div className="grid min-w-0 gap-1">
                    <h4 className="text-[1.15rem] font-extrabold">{step.title}</h4>
                    <p className="text-[0.98rem] leading-normal text-plum-soft">{step.body}</p>
                  </div>
                </Card>
              </Reveal>
              {index < lastStep ? (
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={3}
                  className="absolute inset-x-0 -bottom-[30px] mx-auto size-6 rotate-90 text-plum lg:inset-x-auto lg:-end-[26px] lg:bottom-auto lg:top-1/2 lg:mx-0 lg:-translate-y-1/2 lg:rotate-0 lg:rtl:-scale-x-100"
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid justify-items-center gap-3.5">
        <p id={TECH_LABEL_ID} className="font-display text-[1.1rem] font-bold text-plum-soft">
          {pipeline.techLabel}
        </p>
        <ul aria-labelledby={TECH_LABEL_ID} className="flex flex-wrap justify-center gap-2.5">
          {pipeline.tech.map((item) => (
            <li key={item} className="max-w-full">
              <Sticker tilt="none" tone="lilac" className="max-w-full whitespace-normal text-center">
                {item}
              </Sticker>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
