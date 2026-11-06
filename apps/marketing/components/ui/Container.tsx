import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Centers content at the site's reading width with responsive gutters. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-site px-5 sm:px-6", className)} {...props} />;
}
