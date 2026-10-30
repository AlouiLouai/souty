import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-foreground px-3 py-0.5 font-display text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        secondary: "bg-secondary text-secondary-foreground",
        outline: "bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export type BadgeProps = React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
