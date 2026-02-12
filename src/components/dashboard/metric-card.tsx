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
  color?: "blue" | "emerald" | "violet" | "amber" | "red";
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-200" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-200" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", ring: "ring-violet-200" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-200" },
  red: { bg: "bg-red-50", icon: "text-red-600", ring: "ring-red-200" },
};

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
        "relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border transition-all",
        href && "cursor-pointer hover:shadow-md",
        alert && "border-red-200 ring-1 ring-red-100"
      )}
      onClick={() => href && router.push(href)}
      role={href ? "button" : undefined}
      tabIndex={href ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className={cn("text-3xl font-black tracking-tight", alert ? "text-red-700" : "text-gray-900")}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-bold",
                  trend.value >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>
      </div>
    </div>
  );

  return content;
}
