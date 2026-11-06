import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "sun" | "paper";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full border-3 border-plum font-display font-bold " +
  "no-underline shadow-press transition-[transform,box-shadow] duration-100 " +
  "hover:-translate-y-0.5 hover:shadow-press-up active:translate-y-1 active:shadow-press-down " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

/*
 * Contrast: white on harissa is 3.2:1, which only passes WCAG AA as large
 * text. The primary variant therefore never goes below 19px bold; the small
 * size switches to plum ink, which passes at any size.
 */
const variants: Record<Variant, string> = {
  primary: "bg-harissa text-white",
  sun: "bg-sun text-plum",
  paper: "bg-paper text-plum",
};

const sizes: Record<Size, string> = {
  md: "min-h-[3.25rem] px-6 py-3 text-[1.2rem] leading-none",
  sm: "min-h-11 px-4 py-2 text-base leading-none",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

export function buttonClassName({ variant = "primary", size = "md" }: StyleProps = {}): string {
  // Small primary buttons would put sub-19px white text on harissa.
  const safeVariant = variant === "primary" && size === "sm" ? "sun" : variant;
  return cn(base, variants[safeVariant], sizes[size]);
}

type ButtonProps = ComponentProps<"button"> & StyleProps;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonClassName({ variant, size }), className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<"a"> & StyleProps & { external?: boolean };

/** An anchor that looks like a button. `external` opens a new tab safely. */
export function ButtonLink({ variant, size, className, external, ...props }: ButtonLinkProps) {
  return (
    <a
      className={cn(buttonClassName({ variant, size }), className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      {...props}
    />
  );
}
