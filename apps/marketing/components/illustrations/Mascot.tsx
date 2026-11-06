import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

interface MascotProps {
  /** Describes the drawing for people who cannot see it. */
  label: string;
  className?: string;
}

/**
 * Souty the mascot: a smiling phone that bobs on a soft blob, blinks, sends
 * out sound waves and waves hello with one hand. Its screen shows the app's
 * sentence bar with the name صوتي.
 */
export function Mascot({ label, className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 440 440"
      role="img"
      aria-label={label}
      focusable="false"
      className={cn("overflow-visible", className)}
    >
      <path
        className="origin-center animate-blob fill-pink"
        d="M220 30c80 0 170 40 185 130s-20 190-110 230-210 20-250-60S40 120 90 70 160 30 220 30z"
      />
      <circle cx="70" cy="90" r="10" className="fill-sun" />
      <circle cx="390" cy="120" r="7" className="fill-mint" />
      <circle cx="380" cy="360" r="12" className="fill-lilac" />

      <g className="animate-bob">
        {/* Phone body, screen and speaker slot */}
        <rect x="130" y="90" width="180" height="290" rx="38" className="fill-plum" />
        <rect x="143" y="104" width="154" height="262" rx="28" className="fill-sun" />
        <rect x="196" y="112" width="48" height="10" rx="5" className="fill-plum" />

        {/* Face */}
        <ellipse cx="190" cy="200" rx="13" ry="17" className="origin-box animate-blink fill-plum" />
        <ellipse cx="250" cy="200" rx="13" ry="17" className="origin-box animate-blink fill-plum" />
        <circle cx="194" cy="194" r="4" className="fill-paper" />
        <circle cx="254" cy="194" r="4" className="fill-paper" />
        <ellipse cx="168" cy="238" rx="14" ry="8" opacity="0.7" className="fill-[#FF8FA8]" />
        <ellipse cx="272" cy="238" rx="14" ry="8" opacity="0.7" className="fill-[#FF8FA8]" />
        <path
          d="M190 245q30 30 60 0"
          strokeWidth="7"
          strokeLinecap="round"
          className="fill-none stroke-plum"
        />

        {/* Sound waves; shown still when motion is reduced */}
        <g strokeWidth="7" strokeLinecap="round" className="fill-none stroke-harissa">
          <path
            d="M110 230q-14 -30 0 -60"
            className="animate-soundwave opacity-0 motion-reduce:opacity-100"
          />
          <path
            d="M90 245q-24 -45 0 -90"
            className="animate-soundwave opacity-0 [animation-delay:0.3s] motion-reduce:opacity-100"
          />
          <path
            d="M70 260q-34 -60 0 -120"
            className="animate-soundwave opacity-0 [animation-delay:0.6s] motion-reduce:opacity-100"
          />
        </g>

        {/* Sentence bar, like the one in the app */}
        <rect
          x="160"
          y="300"
          width="120"
          height="40"
          rx="14"
          strokeWidth="4"
          className="fill-paper stroke-plum"
        />
        <text
          x="220"
          y="328"
          textAnchor="middle"
          fontSize="22"
          className="fill-plum font-display font-extrabold"
        >
          {site.nameArabic}
        </text>

        {/* Waving hand */}
        <g className="origin-[330px_330px] animate-wave">
          <path
            d="M300 300 q30 -20 40 -60"
            strokeWidth="14"
            strokeLinecap="round"
            className="fill-none stroke-plum"
          />
          <g transform="translate(330 205)" strokeWidth="5" className="fill-[var(--skin)] stroke-plum">
            <rect x="-26" y="10" width="52" height="46" rx="20" />
            <rect x="-24" y="-30" width="11" height="48" rx="5.5" />
            <rect x="-11" y="-40" width="11" height="58" rx="5.5" />
            <rect x="2" y="-36" width="11" height="54" rx="5.5" />
            <rect x="15" y="-24" width="11" height="42" rx="5.5" />
            <rect x="-44" y="18" width="30" height="12" rx="6" transform="rotate(-30 -30 24)" />
          </g>
        </g>
      </g>
    </svg>
  );
}
