import * as React from "react";

import { cn } from "@/lib/utils";

type DivProps = React.ComponentProps<"div">;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border-2 border-border bg-card text-card-foreground shadow-[4px_4px_0_var(--border)]",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cn("flex items-center p-5 pt-0", className)} {...props} />;
}
