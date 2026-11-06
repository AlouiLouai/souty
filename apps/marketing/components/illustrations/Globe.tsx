import { useId } from "react";
import { cn } from "@/lib/cn";

const CENTER = 160;
const RADIUS = 128;

/** Where the one live sign language sits on the globe. */
const liveDot = { cx: 166, cy: 112 };

/**
 * Sign languages still to come. Fills match the stage chips beside the
 * globe: sun, then lilac, then paper. Positions are abstract on purpose.
 */
const upcomingDots = [
  { cx: 112, cy: 150, fill: "fill-sun" },
  { cx: 96, cy: 196, fill: "fill-sun" },
  { cx: 142, cy: 186, fill: "fill-sun" },
  { cx: 214, cy: 168, fill: "fill-lilac" },
  { cx: 236, cy: 120, fill: "fill-lilac" },
  { cx: 188, cy: 226, fill: "fill-lilac" },
  { cx: 134, cy: 246, fill: "fill-paper" },
  { cx: 70, cy: 128, fill: "fill-paper" },
  { cx: 252, cy: 206, fill: "fill-paper" },
  { cx: 150, cy: 70, fill: "fill-paper" },
] as const;

/** Dotted paths from the live dot towards the next languages. */
const spreadPaths = [
  "M166 112Q132 116 112 150",
  "M166 112Q204 124 214 168",
  "M166 112Q206 96 236 120",
  "M166 112Q172 190 134 246",
] as const;

interface GlobeProps {
  /** Describes the picture for people who cannot see it. */
  label: string;
  className?: string;
}

/**
 * An abstract globe: an ink circle with meridians and parallels, one pulsing
 * dot for the sign language that is live and plain dots for those to come.
 * It shows no continents and no borders.
 */
export function Globe({ label, className }: GlobeProps) {
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 320 320"
      role="img"
      aria-label={label}
      focusable="false"
      className={cn("h-auto w-full overflow-visible", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={CENTER} cy={CENTER} r={RADIUS} />
        </clipPath>
      </defs>

      {/* Orbit */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r="152"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="2 14"
        className="origin-box animate-[spin_90s_linear_infinite] stroke-plum-soft"
      />

      {/* Hard shadow, then the sphere */}
      <circle cx={CENTER + 7} cy={CENTER + 7} r={RADIUS} className="fill-plum" />
      <circle cx={CENTER} cy={CENTER} r={RADIUS} className="fill-[#FFF3D6]" />

      <g clipPath={`url(#${clipId})`} fill="none">
        {/* Meridians and parallels */}
        <g className="stroke-plum" strokeWidth="2.5" opacity="0.4">
          <ellipse cx={CENTER} cy={CENTER} rx="46" ry={RADIUS} />
          <ellipse cx={CENTER} cy={CENTER} rx="96" ry={RADIUS} />
          <path d="M160 32V288" />
          <path d="M49 96Q160 118 271 96" />
          <path d="M32 160Q160 186 288 160" />
          <path d="M49 224Q160 246 271 224" />
        </g>
        {/* Gloss */}
        <path d="M62 118Q74 76 112 54" className="stroke-paper" strokeWidth="9" strokeLinecap="round" />
        <g className="stroke-plum" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 8">
          {spreadPaths.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>

      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" className="stroke-plum" strokeWidth="6" />

      <g className="stroke-plum" strokeWidth="3">
        {upcomingDots.map((dot) => (
          <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r="7" className={dot.fill} />
        ))}
      </g>

      {/* The live language */}
      <circle cx={liveDot.cx} cy={liveDot.cy} r="13" className="origin-box animate-pulse-ring fill-mint" />
      <circle cx={liveDot.cx} cy={liveDot.cy} r="11" className="fill-mint stroke-plum" strokeWidth="4" />

      {/* Sparkles */}
      <path
        d="M40 26Q43 41 58 44Q43 47 40 62Q37 47 22 44Q37 41 40 26Z"
        className="origin-box animate-heartbeat fill-sun stroke-plum"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M286 262Q288 272 298 274Q288 276 286 286Q284 276 274 274Q284 272 286 262Z"
        className="fill-pink stroke-plum"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
