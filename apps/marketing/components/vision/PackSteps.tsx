import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/content";
import { cn } from "@/lib/cn";

const numberTones = ["bg-sun", "bg-lilac", "bg-mint"] as const;

interface PackStepsProps {
  title: string;
  steps: Dictionary["vision"]["how"];
  headingId: string;
  /** BCP 47 tag used to write the step numbers. */
  numberLocale: string;
}

/** The numbered steps by which a new sign language joins the app. */
export function PackSteps({ title, steps, headingId, numberLocale }: PackStepsProps) {
  const numberFormat = new Intl.NumberFormat(numberLocale);
  const lastIndex = steps.length - 1;

  return (
    <div className="mt-16 sm:mt-24">
      <h3 id={headingId} className="text-center text-[clamp(1.6rem,3.8vw,2.25rem)] font-extrabold">
        {title}
      </h3>
      <ol aria-labelledby={headingId} className="mt-9 grid gap-6 md:grid-cols-3 md:gap-8">
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            <Reveal delay={index * 120} className="h-full">
              <Card className="h-full p-6">
                <span
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-full border-3 border-plum font-display text-[1.5rem] font-extrabold leading-none shadow-hard-sm",
                    numberTones[index % numberTones.length]
                  )}
                  aria-hidden="true"
                >
                  {numberFormat.format(index + 1)}
                </span>
                <h4 className="mt-4 text-[1.25rem] font-extrabold">{step.title}</h4>
                <p className="mt-2 text-plum-soft">{step.body}</p>
              </Card>
            </Reveal>
            {index < lastIndex ? (
              <ArrowRight
                className="absolute -end-[1.625rem] top-1/2 hidden h-5 w-5 -translate-y-1/2 md:block rtl:-scale-x-100"
                strokeWidth={3}
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
