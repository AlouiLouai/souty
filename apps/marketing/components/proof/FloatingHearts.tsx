import { Heart } from "lucide-react";
import type { CSSProperties } from "react";

const HEART_COUNT = 14;

/**
 * A repeatable stand-in for Math.random: the fractional part of a multiple
 * of an irrational step. The same index always gives the same value, so the
 * server and the browser draw identical hearts.
 */
function scatter(index: number, step: number): number {
  const value = (index + 1) * step;
  return value - Math.floor(value);
}

function heartStyle(index: number): CSSProperties {
  const size = `${(14 + scatter(index, 0.754878) * 22).toFixed(1)}px`;
  return {
    insetInlineStart: `${(2 + scatter(index, 0.618034) * 94).toFixed(1)}%`,
    width: size,
    height: size,
    animationDuration: `${(9 + scatter(index, 0.569840) * 9).toFixed(1)}s`,
    // Negative delays start every heart part-way up, so the band is never empty.
    animationDelay: `-${(scatter(index, 0.414214) * 14).toFixed(1)}s`,
  };
}

const hearts = Array.from({ length: HEART_COUNT }, (_, index) => ({ id: index, style: heartStyle(index) }));

/**
 * Decorative pink hearts that float up behind the real-story text.
 * Fills its nearest positioned ancestor. With reduced motion the hearts stay
 * parked below the bottom edge, out of sight.
 */
export function FloatingHearts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {hearts.map((heart) => (
        <Heart
          key={heart.id}
          className="absolute -bottom-10 animate-[rise_12s_linear_infinite] text-pink opacity-70"
          fill="currentColor"
          strokeWidth={0}
          style={heart.style}
        />
      ))}
    </div>
  );
}
