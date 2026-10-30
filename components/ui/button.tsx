import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-transparent font-display text-sm font-bold transition-[transform,box-shadow,background-color] active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-primary text-primary-foreground shadow-[0_4px_0_var(--foreground)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--foreground)] active:shadow-[0_1px_0_var(--foreground)]",
        destructive:
          "border-foreground bg-destructive text-destructive-foreground shadow-[0_4px_0_var(--foreground)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--foreground)] active:shadow-[0_1px_0_var(--foreground)]",
        outline:
          "border-foreground bg-card text-foreground shadow-[0_4px_0_var(--foreground)] hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_6px_0_var(--foreground)] active:shadow-[0_1px_0_var(--foreground)]",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
