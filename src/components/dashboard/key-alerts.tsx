"use client";

import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AlertItem {
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  action: string;
  link: string;
}

interface KeyAlertsProps {
  alerts: AlertItem[];
}

const priorityConfig = {
  critical: {
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500 animate-pulse",
    text: "text-red-700",
  },
  high: { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-700" },
  medium: { bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500", text: "text-primary/90" },
  low: { bg: "bg-muted/30 border-border/40", dot: "bg-muted", text: "text-muted-foreground" },
};

/**
 *
 * @param root0
 * @param root0.alerts
 */
export function KeyAlerts({ alerts }: KeyAlertsProps) {
  const router = useRouter();

  if (!alerts.length) {
    return (
      <Card className="bg-background h-full border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base font-semibold">
            Operational Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">All Clear</p>
            <p className="text-muted-foreground mt-1 text-xs">No issues requiring attention</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background h-full border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Attention Required
          </CardTitle>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">
            {alerts.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, i) => {
          const config = priorityConfig[alert.priority];
          return (
            <button
              key={i}
              onClick={() => router.push(alert.link)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm",
                config.bg
              )}
            >
              <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", config.dot)} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm leading-tight font-medium", config.text)}>
                  {alert.message}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[10px] font-medium tracking-wide uppercase">
                  {alert.category}
                </p>
              </div>
              <ArrowRight className="text-muted-foreground group-hover:text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0 transition-colors" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
