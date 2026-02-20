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
  critical: { bg: "bg-red-50 border-red-200", dot: "bg-red-500 animate-pulse", text: "text-red-700" },
  high: { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-700" },
  medium: { bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500", text: "text-blue-700" },
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
      <Card className="shadow-sm border-0 bg-background h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Operational Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">All Clear</p>
            <p className="text-xs text-muted-foreground mt-1">No issues requiring attention</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-background h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Attention Required
          </CardTitle>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
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
                "w-full flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm text-left group",
                config.bg
              )}
            >
              <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", config.dot)} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium leading-tight", config.text)}>
                  {alert.message}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">
                  {alert.category}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-muted-foreground mt-0.5 shrink-0 transition-colors" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
