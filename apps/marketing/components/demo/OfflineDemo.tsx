"use client";

import { Plane } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { confettiFrom } from "@/lib/confetti";

/** A status line, with its Derja version on the English and French pages. */
interface OfflineMessage {
  text: string;
  derja?: string;
}

export interface OfflineDemoLabels {
  toggle: string;
  illustrationAlt: string;
  /** Shown while the network is on. */
  off: OfflineMessage;
  /** Shown once airplane mode is switched on. */
  on: OfflineMessage;
}

interface OfflineDemoProps {
  labels: OfflineDemoLabels;
  /** The band heading, rendered on the server. */
  children: ReactNode;
}

/**
 * The offline proof: a sky scene with a smiling phone and an "Airplane mode"
 * switch. Switching it on flies a plane across, crosses out the Wi-Fi symbol
 * and shows that Souty keeps working.
 */
export function OfflineDemo({ labels, children }: OfflineDemoProps) {
  const [airplaneMode, setAirplaneMode] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const switchId = useId();

  function toggle(event: ChangeEvent<HTMLInputElement>) {
    const on = event.target.checked;
    setAirplaneMode(on);
    if (on && messageRef.current) confettiFrom(messageRef.current, 40);
  }

  const message = airplaneMode ? labels.on : labels.off;

  return (
    <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
      <div className="md:col-start-2 md:self-end">{children}</div>

      <div className="relative mx-auto aspect-[16/11] w-full max-w-[520px] overflow-hidden rounded-[30px] border-3 border-plum bg-[linear-gradient(#9FD8FF,#DDF1FF)] shadow-hard-lg md:col-start-1 md:row-span-2 md:row-start-1 md:max-w-none md:self-center">
        <OfflineScene airplaneMode={airplaneMode} label={labels.illustrationAlt} />
      </div>

      <div className="grid content-start gap-4 md:col-start-2 md:self-start">
        <label
          htmlFor={switchId}
          className="flex min-h-11 w-fit cursor-pointer select-none items-center gap-3.5 font-display text-[1.25rem] font-bold text-plum"
        >
          <input
            id={switchId}
            type="checkbox"
            role="switch"
            checked={airplaneMode}
            onChange={toggle}
            className={cn(
              "relative m-0 h-11 w-[78px] flex-none cursor-pointer appearance-none rounded-full border-3 border-plum bg-paper",
              "transition-colors duration-300 checked:bg-sun",
              "after:absolute after:start-1 after:top-1 after:size-[30px] after:rounded-full after:bg-plum after:content-['']",
              "after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.3,1.6,0.5,1)]",
              "checked:after:translate-x-[34px] rtl:checked:after:-translate-x-[34px]"
            )}
          />
          {labels.toggle}
          <Plane aria-hidden="true" className="size-6 rtl:-scale-x-100" strokeWidth={2.5} />
        </label>

        <Card
          ref={messageRef}
          aria-live="polite"
          depth="sm"
          tone={airplaneMode ? "mint" : "paper"}
          className="grid justify-items-start gap-1 rounded-[20px] px-[1.125rem] py-4 transition-colors duration-300"
        >
          {message.derja ? (
            <span lang="ar-TN" dir="rtl" className="font-display text-[1.4rem] font-extrabold leading-snug">
              {message.derja}
            </span>
          ) : null}
          <span>{message.text}</span>
        </Card>
      </div>
    </div>
  );
}

interface OfflineSceneProps {
  airplaneMode: boolean;
  label: string;
}

/** The sky: drifting clouds, the Wi-Fi symbol, the plane, and the phone on its hill. */
function OfflineScene({ airplaneMode, label }: OfflineSceneProps) {
  return (
    <svg viewBox="0 0 560 385" role="img" aria-label={label} className="absolute inset-0 size-full">
      <g className="animate-drift fill-paper">
        <ellipse cx="80" cy="80" rx="60" ry="24" />
        <ellipse cx="110" cy="66" rx="36" ry="26" />
      </g>
      <g className="animate-drift fill-paper [animation-delay:-9s] [animation-duration:26s]">
        <ellipse cx="60" cy="150" rx="46" ry="18" />
        <ellipse cx="84" cy="140" rx="28" ry="20" />
      </g>

      {/* Parked off-stage until airplane mode sends it across. */}
      <g className={airplaneMode ? "animate-fly" : "-translate-x-[180px]"}>
        <path
          d="M0 200l70 -14 30 -34 14 4 -14 32 40 -6 12 -12 10 2 -6 20 6 18 -10 2 -12 -12 -40 -4 14 32 -14 4 -30 -34z"
          className="fill-harissa stroke-plum"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </g>

      <g
        transform="translate(440 70)"
        className={cn(
          "fill-none stroke-plum transition-opacity duration-[400ms]",
          airplaneMode ? "opacity-15" : "opacity-100"
        )}
        strokeWidth="7"
        strokeLinecap="round"
      >
        <path d="M-36 -6q36 -30 72 0" />
        <path d="M-24 8q24 -20 48 0" />
        <path d="M-12 22q12 -10 24 0" />
      </g>
      <g
        transform="translate(440 82)"
        className={cn(
          "stroke-harissa transition-opacity duration-[400ms]",
          airplaneMode ? "opacity-100" : "opacity-0"
        )}
        strokeWidth="8"
        strokeLinecap="round"
      >
        <path d="M-30 -30l60 60M30 -30l-60 60" />
      </g>

      <path d="M0 330q140 -40 280 0t280 0v60H0z" className="fill-mint" />
      <g transform="translate(250 200)">
        <rect x="0" y="0" width="70" height="120" rx="16" className="fill-plum" />
        <rect x="6" y="7" width="58" height="104" rx="11" className="fill-sun" />
        <ellipse cx="24" cy="45" rx="5" ry="7" className="fill-plum" />
        <ellipse cx="46" cy="45" rx="5" ry="7" className="fill-plum" />
        <path d="M22 62q13 14 26 0" className="fill-none stroke-plum" strokeWidth="4" strokeLinecap="round" />
        <rect x="14" y="84" width="42" height="16" rx="6" className="fill-paper" />
      </g>
    </svg>
  );
}
