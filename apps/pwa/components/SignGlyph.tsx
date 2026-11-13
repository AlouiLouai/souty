import { FINGER_CHAINS, PALM_OUTLINE, shapeForSign, type HandShape } from "@souty/vocabulary";
import { cn } from "@/lib/utils";

/** Half the side of the square the hand is drawn in, in hand units. */
const VIEW = 1.5;
const FINGER_WIDTH = 0.2;
const OUTLINE = 0.13;

function path(shape: HandShape, indices: readonly number[], closed = false): string {
  const commands = indices.flatMap((index, position) => {
    const point = shape[index];
    // SVG's y axis points down; hand units point up.
    return point ? [`${position === 0 ? "M" : "L"}${point[0].toFixed(3)} ${(-point[1]).toFixed(3)}`] : [];
  });
  return commands.join("") + (closed ? "Z" : "");
}

/** Whether a sign has a hand shape to draw. */
export function hasGlyph(label: string): boolean {
  return shapeForSign(label) !== null;
}

/**
 * A still drawing of one sign's hand shape: the real dataset hand for a
 * Tunisian Sign Language sign, the modelled gesture for a universal one.
 * Decorative: the word next to it carries the meaning. Renders nothing for
 * a label with no known shape.
 */
export function SignGlyph({ label, className }: { label: string; className?: string }) {
  const shape = shapeForSign(label);
  if (!shape) return null;

  const palm = path(shape, PALM_OUTLINE, true);
  const fingers = FINGER_CHAINS.map((chain) => path(shape, chain)).join("");

  return (
    <svg
      viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g stroke="var(--plum)" fill="var(--plum)">
        <path d={palm} strokeWidth={FINGER_WIDTH * 0.9 + OUTLINE} />
        <path d={fingers} strokeWidth={FINGER_WIDTH + OUTLINE} fill="none" />
      </g>
      <g stroke="var(--skin)" fill="var(--skin)">
        <path d={palm} strokeWidth={FINGER_WIDTH * 0.9} />
        <path d={fingers} strokeWidth={FINGER_WIDTH} fill="none" />
      </g>
    </svg>
  );
}
