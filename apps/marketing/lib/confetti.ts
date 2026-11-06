import { palette } from "@souty/brand/palette";

/**
 * A tiny confetti burst for moments of success (a word locked in, a link
 * copied). One shared full-screen canvas is created on first use. Does
 * nothing for visitors who prefer reduced motion. Client-side only.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
  spin: number;
  life: number;
}

const COLORS = [palette.harissa, palette.sun, palette.mint, palette.lilac, palette.pink];
const MAX_PARTICLES = 400;

let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let frame: number | null = null;

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "60",
    });
    document.body.appendChild(canvas);
    context = canvas.getContext("2d");
  }
  if (!context) return null;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

function tick(): void {
  if (!context) return;
  const { innerWidth: width, innerHeight: height } = window;
  context.clearRect(0, 0, width, height);

  for (const particle of particles) {
    particle.vy += 0.28;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.angle += particle.spin;
    particle.life -= 0.012;

    context.save();
    context.globalAlpha = Math.max(0, particle.life);
    context.translate(particle.x, particle.y);
    context.rotate(particle.angle);
    context.fillStyle = particle.color;
    context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
    context.restore();
  }

  particles = particles.filter((particle) => particle.life > 0 && particle.y < height + 40);
  if (particles.length > 0) {
    frame = requestAnimationFrame(tick);
  } else {
    context.clearRect(0, 0, width, height);
    frame = null;
  }
}

/** Bursts confetti from a point in viewport coordinates. */
export function confettiAt(x: number, y: number, count = 60): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!ensureCanvas()) return;

  const room = Math.max(0, MAX_PARTICLES - particles.length);
  for (let index = 0; index < Math.min(count, room); index++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 9 - 3,
      size: Math.random() * 6 + 4,
      color: COLORS[index % COLORS.length] ?? palette.sun,
      angle: Math.random() * 6,
      spin: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }
  if (frame === null) frame = requestAnimationFrame(tick);
}

/** Bursts confetti from the center of an element. */
export function confettiFrom(element: Element, count?: number): void {
  const rect = element.getBoundingClientRect();
  confettiAt(rect.left + rect.width / 2, rect.top + rect.height / 2, count);
}
