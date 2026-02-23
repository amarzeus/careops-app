import { cn } from "@/lib/utils";

/**
 *
 * @param root0
 * @param root0.className
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-muted/50/50 animate-pulse rounded-md", className)} {...props} />;
}

export { Skeleton };
