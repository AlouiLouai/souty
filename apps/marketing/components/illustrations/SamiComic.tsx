import type { ReactNode } from "react";
import { palette } from "@souty/brand/palette";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/*
 * The story of Sami, a three-panel comic: nobody understands him at the
 * desk (1), he signs to Souty (2), the phone speaks and the agent smiles (3).
 * Panel 1 closes the Problem section; panels 2 and 3 open the Idea section.
 */

const INK = palette.plum;
const CLERK_SKIN = "#C98A62";

const artworkClassName = "block h-auto w-full";

interface ArtworkProps {
  /** Describes the scene for people who cannot see it. */
  label: string;
}

/** Sami's head, hair and jumper. His face changes per panel and is passed in. */
function Sami({ x = 0, children }: { x?: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <circle cx="80" cy="82" r="26" fill={palette.skin} stroke={INK} strokeWidth="4" />
      <path d="M56 74q24 -30 48 0" fill={INK} />
      <rect x="52" y="104" width="56" height="80" rx="22" fill={palette.harissa} stroke={INK} strokeWidth="4" />
      {children}
    </g>
  );
}

/** The agent behind the service desk. The mouth changes per panel and is passed in. */
function ClerkAtDesk({ children }: { children: ReactNode }) {
  return (
    <>
      <rect x="150" y="120" width="140" height="60" rx="8" fill={palette.lilac} stroke={INK} strokeWidth="4" />
      <circle cx="225" cy="78" r="26" fill={CLERK_SKIN} stroke={INK} strokeWidth="4" />
      <rect x="198" y="100" width="54" height="30" rx="14" fill={palette.mint} stroke={INK} strokeWidth="4" />
      <circle cx="216" cy="76" r="7" fill="none" stroke={INK} strokeWidth="3" />
      <circle cx="236" cy="76" r="7" fill="none" stroke={INK} strokeWidth="3" />
      {children}
    </>
  );
}

/** Panel 1: at the service desk, the agent is puzzled while Sami signs. */
export function SamiAtTheDesk({ label, questionMark }: ArtworkProps & { questionMark: string }) {
  return (
    <svg viewBox="0 0 300 210" role="img" aria-label={label} className={cn(artworkClassName, "bg-[#FFF3D6]")}>
      <rect x="0" y="150" width="300" height="60" fill="#F5D9A8" />
      <ClerkAtDesk>
        <path d="M218 92q7 -4 14 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      </ClerkAtDesk>
      <text
        className="origin-box animate-wobble font-display"
        x="262"
        y="48"
        textAnchor="middle"
        fontWeight="800"
        fontSize="40"
        fill={palette.harissa}
      >
        {questionMark}
      </text>
      <Sami>
        <circle cx="72" cy="84" r="3.5" fill={INK} />
        <circle cx="90" cy="84" r="3.5" fill={INK} />
        <path d="M74 96q7 4 14 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      </Sami>
      <g className="origin-box animate-shake">
        <circle cx="128" cy="100" r="12" fill={palette.skin} stroke={INK} strokeWidth="4" />
        <path d="M118 116l-10 10" stroke={INK} strokeWidth="10" strokeLinecap="round" />
      </g>
      <path
        d="M140 70q8 -6 16 0M138 58q12 -10 24 0"
        stroke={INK}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Panel 2: Sami signs in front of a floating phone running Souty. */
export function SamiSignsToPhone({ label }: ArtworkProps) {
  return (
    <svg viewBox="0 0 300 210" role="img" aria-label={label} className={cn(artworkClassName, "bg-[#E0F7F1]")}>
      <rect x="0" y="150" width="300" height="60" fill="#BDEFE2" />
      <Sami x={30}>
        <circle cx="72" cy="84" r="3.5" fill={INK} />
        <circle cx="90" cy="84" r="3.5" fill={INK} />
        <path d="M70 94q10 8 20 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      </Sami>
      <g className="animate-bob-fast">
        <rect x="180" y="60" width="62" height="110" rx="14" fill={INK} />
        <rect x="186" y="68" width="50" height="94" rx="9" fill={palette.sun} />
        <circle cx="211" cy="105" r="18" fill="none" stroke={palette.mint} strokeWidth="4" strokeDasharray="80 120" />
        <circle cx="211" cy="105" r="4" fill={INK} />
        <circle cx="203" cy="96" r="3" fill={INK} />
        <circle cx="219" cy="96" r="3" fill={INK} />
        <rect x="192" y="140" width="38" height="14" rx="5" fill={palette.paper} />
      </g>
      <g className="origin-box animate-shake">
        <circle cx="152" cy="92" r="12" fill={palette.skin} stroke={INK} strokeWidth="4" />
        <path d="M152 80v-14M146 82l-6 -12M158 82l6 -12" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </g>
      <path d="M160 110l20 0" stroke={palette.mint} strokeWidth="3" strokeDasharray="4 5" />
    </svg>
  );
}

/*
 * Sound waves fade in and drift away in turn. Without motion they stay
 * drawn, so the phone still visibly "speaks".
 */
const soundWaveClassName = "motion-safe:animate-soundwave motion-safe:opacity-0";

/** Panel 3: the phone speaks out loud, the agent smiles, a heart beats. */
export function PhoneSpeaksForSami({ label, bubble }: ArtworkProps & { bubble: string }) {
  return (
    <svg viewBox="0 0 300 210" role="img" aria-label={label} className={cn(artworkClassName, "bg-[#FFE4EC]")}>
      <rect x="0" y="150" width="300" height="60" fill="#FFC7D6" />
      <ClerkAtDesk>
        <path d="M214 90q11 10 22 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      </ClerkAtDesk>
      <path
        className="origin-box animate-heartbeat"
        d="M262 40c-6-10-20-4-16 6l16 14 16-14c4-10-10-16-16-6z"
        fill={palette.harissa}
      />
      <Sami>
        <path d="M68 84q4 -4 8 0M86 84q4 -4 8 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M70 94q11 12 22 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      </Sami>
      <g className="animate-bob-fast">
        <rect x="112" y="110" width="30" height="50" rx="7" fill={INK} />
        <rect x="115" y="114" width="24" height="42" rx="4" fill={palette.sun} />
      </g>
      <g stroke={palette.harissa} strokeWidth="4" fill="none" strokeLinecap="round">
        <path className={soundWaveClassName} d="M150 120q8 10 0 20" />
        <path className={cn(soundWaveClassName, "[animation-delay:0.3s]")} d="M160 112q14 18 0 36" />
        <path className={cn(soundWaveClassName, "[animation-delay:0.6s]")} d="M170 104q20 26 0 52" />
      </g>
      <rect x="96" y="20" width="110" height="40" rx="16" fill={palette.paper} stroke={INK} strokeWidth="4" />
      <text
        className="font-display"
        x="151"
        y="46"
        textAnchor="middle"
        direction="rtl"
        fontWeight="800"
        fontSize="18"
        fill={INK}
      >
        {bubble}
      </text>
    </svg>
  );
}

interface ComicPanelProps {
  /** Position in the strip, shown in the badge. */
  number: number;
  /** Tunisian Arabic caption. Leave out on the Arabic page, where `caption` is already Arabic. */
  derja?: string;
  /** Caption in the page language. */
  caption: string;
  /** Slight rotation, straightened on hover. */
  tilt?: "left" | "right";
  /** The panel artwork. */
  children: ReactNode;
}

/**
 * One frame of Sami's comic strip: the artwork on top, then a caption with
 * the panel number, the Tunisian Arabic line and its translation.
 */
export function ComicPanel({ number, derja, caption, tilt, children }: ComicPanelProps) {
  return (
    <Card
      as="figure"
      className={cn(
        "grid h-full grid-rows-[auto_1fr] overflow-hidden text-start transition-transform duration-300",
        "hover:rotate-0 hover:scale-[1.02]",
        tilt === "left" && "-rotate-1",
        tilt === "right" && "rotate-1"
      )}
    >
      {children}
      <figcaption className="flex items-start gap-3 border-t-3 border-plum px-4 pb-5 pt-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border-3 border-plum bg-sun font-display text-[1.1rem] font-extrabold leading-none">
          {number}
        </span>
        <span className="grid min-w-0 flex-1 gap-1">
          {derja ? (
            <span lang="ar-TN" dir="rtl" className="font-display text-[1.2rem] font-extrabold leading-snug">
              {derja}
            </span>
          ) : null}
          <span
            className={
              derja ? "text-[0.98rem] text-plum-soft" : "font-display text-[1.2rem] font-extrabold leading-snug"
            }
          >
            {caption}
          </span>
        </span>
      </figcaption>
    </Card>
  );
}
