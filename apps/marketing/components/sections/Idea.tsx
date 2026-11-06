import type { ReactNode } from "react";
import { WORD_BY_LABEL } from "@souty/vocabulary";
import { HoldToLock } from "@/components/demo/HoldToLock";
import { SpeakButton } from "@/components/demo/SpeakButton";
import { ComicPanel, PhoneSpeaksForSami, SamiSignsToPhone } from "@/components/illustrations/SamiComic";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionIds } from "@/lib/site";
import type { SectionProps } from "./types";

const HEADING_ID = "idea-title";
const STAGGER_MS = 120;

/** Model labels of the signs the hold-to-lock demo cycles through: deaf, dad, hospital, Thursday. */
const HOLD_DEMO_LABELS = ["assam", "bou", "sbitar", "5mis"];
const holdDemoWords = HOLD_DEMO_LABELS.flatMap((label) => WORD_BY_LABEL[label] ?? []);

/** Step 1 artwork: a phone with its camera, on a pink disc. */
function PointCameraArt() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className="size-[140px]">
      <circle cx="60" cy="60" r="56" className="fill-[#FFE4EC]" />
      <rect x="38" y="20" width="44" height="80" rx="12" className="fill-plum" />
      <rect x="43" y="27" width="34" height="66" rx="7" className="fill-sun" />
      <circle cx="60" cy="50" r="10" fill="none" strokeWidth="4" className="stroke-plum" />
      <circle cx="60" cy="50" r="4" className="fill-plum" />
    </svg>
  );
}

interface StepCardProps {
  number: number;
  /** Tunisian Arabic name of the step. Left out on the Arabic page. */
  derja?: string;
  title: string;
  body: string;
  /** The illustration or the playable control. */
  children: ReactNode;
}

/** One of the three gestures: number badge, artwork or control, then the words. */
function StepCard({ number, derja, title, body, children }: StepCardProps) {
  return (
    <Card className="grid h-full content-start justify-items-center gap-3 px-5 py-6 text-center">
      <span
        aria-hidden="true"
        className="grid size-[46px] place-items-center rounded-full border-3 border-plum bg-sun font-display text-[1.3rem] font-extrabold leading-none"
      >
        {number}
      </span>
      <div className="grid w-full content-center justify-items-center lg:min-h-[250px]">{children}</div>
      {derja ? (
        <p lang="ar-TN" dir="rtl" className="font-display text-[1.5rem] font-extrabold leading-snug">
          {derja}
        </p>
      ) : null}
      <h4 className="text-[1.3rem] font-bold">{title}</h4>
      <p className="text-plum-soft">{body}</p>
    </Card>
  );
}

/**
 * The idea: Sami's comic ends well (he signs, the phone speaks, the agent
 * understands), then the three gestures of the app, two of them playable.
 */
export function Idea({ dict, locale }: SectionProps) {
  const copy = dict.idea;
  // Tunisian Arabic lines accompany English and French; the Arabic page is already Arabic.
  const showDerja = locale !== "ar";
  const { point, hold, speak } = copy.steps;

  return (
    <Section tone="sky" wave id={sectionIds.idea} aria-labelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        derja={showDerja ? copy.derja : undefined}
        title={copy.title}
        lead={copy.lead}
      />

      <div className="mx-auto grid max-w-[460px] gap-7 md:max-w-[940px] md:grid-cols-2">
        <Reveal className="h-full">
          <ComicPanel
            number={2}
            derja={showDerja ? copy.comic.signing.derja : undefined}
            caption={copy.comic.signing.caption}
            tilt="left"
          >
            <SamiSignsToPhone label={copy.comic.signing.alt} />
          </ComicPanel>
        </Reveal>
        <Reveal delay={STAGGER_MS} className="h-full">
          <ComicPanel
            number={3}
            derja={showDerja ? copy.comic.speaking.derja : undefined}
            caption={copy.comic.speaking.caption}
            tilt="right"
          >
            <PhoneSpeaksForSami label={copy.comic.speaking.alt} bubble={copy.comicBubble} />
          </ComicPanel>
        </Reveal>
      </div>

      <div className="mb-8 mt-16 grid justify-items-center gap-3 text-center sm:mt-20">
        <h3 className="text-[clamp(1.5rem,3.6vw,2.1rem)] font-extrabold">{copy.stepsTitle}</h3>
        <p className="max-w-[60ch] text-[1.125rem] text-plum-soft">{copy.stepsLead}</p>
      </div>

      <ol role="list" className="mx-auto grid max-w-[460px] gap-6 lg:max-w-none lg:grid-cols-3">
        <li>
          <Reveal className="h-full">
            <StepCard number={1} derja={showDerja ? point.derja : undefined} title={point.title} body={point.body}>
              <PointCameraArt />
            </StepCard>
          </Reveal>
        </li>
        <li>
          <Reveal delay={STAGGER_MS} className="h-full">
            <StepCard number={2} derja={showDerja ? hold.derja : undefined} title={hold.title} body={hold.body}>
              <HoldToLock
                words={holdDemoWords}
                strings={{
                  label: copy.hold.label,
                  idleDerja: showDerja ? copy.hold.idleDerja : undefined,
                  holdingDerja: showDerja ? copy.hold.holdingDerja : undefined,
                  idle: copy.hold.idle,
                  holding: copy.hold.holding,
                  locked: copy.hold.locked,
                  statusHolding: copy.hold.statusHolding,
                  statusSuccess: copy.hold.statusSuccess,
                  statusTooShort: copy.hold.statusTooShort,
                }}
              />
            </StepCard>
          </Reveal>
        </li>
        <li>
          <Reveal delay={STAGGER_MS * 2} className="h-full">
            <StepCard number={3} derja={showDerja ? speak.derja : undefined} title={speak.title} body={speak.body}>
              <SpeakButton
                label={copy.speak.label}
                utterance={copy.speak.utterance}
                meaning={showDerja ? copy.speak.meaning : undefined}
                noVoice={copy.speak.noVoice}
              />
            </StepCard>
          </Reveal>
        </li>
      </ol>
    </Section>
  );
}
