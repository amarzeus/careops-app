"use client";

import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  time: string;
  service: string;
  contact: string;
  status: string;
}

interface TodaysScheduleProps {
  bookings: ScheduleItem[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-100 text-primary/90 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NO_SHOW: "bg-red-100 text-red-700 border-red-200",
};

/**
 *
 * @param root0
 * @param root0.bookings
 */
export function TodaysSchedule({ bookings }: TodaysScheduleProps) {
  const router = useRouter();

  return (
    <Card className="bg-background border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
            <Clock className="text-primary h-4 w-4" />
            Today&apos;s Schedule
          </CardTitle>
          <button
            onClick={() => router.push("/bookings")}
            className="text-primary hover:text-primary/90 text-xs font-medium"
          >
            View all
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            <Clock className="mx-auto mb-2 h-8 w-8 opacity-30" />
            <p>No bookings scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 6).map((booking) => (
              <button
                key={booking.id}
                onClick={() => router.push("/bookings")}
                className="hover:bg-muted/30 group flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors"
              >
                <div className="w-14 shrink-0 text-center">
                  <p className="text-foreground text-sm font-bold">{booking.time}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground truncate text-sm font-medium">
                    {booking.contact}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{booking.service}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-[10px] font-semibold",
                    statusColors[booking.status] || statusColors.PENDING
                  )}
                >
                  {booking.status.replace("_", " ")}
                </Badge>
              </button>
            ))}
            {bookings.length > 6 && (
              <p className="text-muted-foreground pt-1 text-center text-xs">
                +{bookings.length - 6} more bookings
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
