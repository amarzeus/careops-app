import { cn } from "@/lib/utils"

/**
 *
 * @param root0
 * @param root0.className
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50/50", className)}
      {...props}
    />
  )
}

export { Skeleton }
