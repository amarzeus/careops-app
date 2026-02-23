"use client";

import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; label: string };
  alert?: boolean;
  href?: string;
  color?: "blue" | "emerald" | "violet" | "amber" | "red" | "gray";
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "text-primary", ring: "ring-blue-200" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-200" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", ring: "ring-violet-200" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-200" },
  red: { bg: "bg-red-50", icon: "text-red-600", ring: "ring-red-200" },
  gray: { bg: "bg-muted/30", icon: "text-muted-foreground", ring: "ring-gray-200" },
};

/**
 *
 * @param root0
 * @param root0.title
 * @param root0.value
 * @param root0.icon
 * @param root0.description
 * @param root0.trend
 * @param root0.alert
 * @param root0.href
 * @param root0.color
 */
export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  alert,
  href,
  color = "blue",
}: MetricCardProps) {
  const router = useRouter();
  const colors = alert ? colorMap.red : colorMap[color];

  const content = (
    <div
      className={cn(
        "bg-background relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all",
        href && "cursor-pointer hover:shadow-md",
        alert && "border-red-200 ring-1 ring-red-100"
      )}
      onClick={() => href && router.push(href)}
      role={href ? "button" : undefined}
      tabIndex={href ? 0 : undefined}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground truncate text-[11px] font-semibold tracking-wider uppercase">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                "text-2xl font-bold tracking-tight",
                alert ? "text-red-700" : "text-foreground"
              )}
            >
              {value}
            </p>
            {trend && (
              <div className="flex translate-y-[2px] transform items-center gap-0.5">
                <span
                  className={cn(
                    "text-[10px] font-bold",
                    trend.value >= 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {trend.value >= 0 ? "+" : ""}
                  {trend.value}
                </span>
                <span className="text-muted-foreground hidden text-[10px] xl:inline">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground truncate text-[11px]">{description}</p>
          )}
        </div>
        <div className={cn("shrink-0 rounded-lg p-2", colors.bg)}>
          <Icon className={cn("h-4 w-4", colors.icon)} />
        </div>
      </div>
    </div>
  );

  return content;
}
