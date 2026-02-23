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
    <Card className="shadow-sm border-0 bg-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Today&apos;s Schedule
          </CardTitle>
          <button
            onClick={() => router.push("/bookings")}
            className="text-xs text-primary hover:text-primary/90 font-medium"
          >
            View all
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No bookings scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 6).map((booking) => (
              <button
                key={booking.id}
                onClick={() => router.push("/bookings")}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors text-left group"
              >
                <div className="w-14 text-center shrink-0">
                  <p className="text-sm font-bold text-foreground">{booking.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">{booking.contact}</p>
                  <p className="text-xs text-muted-foreground truncate">{booking.service}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-semibold shrink-0", statusColors[booking.status] || statusColors.PENDING)}
                >
                  {booking.status.replace("_", " ")}
                </Badge>
              </button>
            ))}
            {bookings.length > 6 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{bookings.length - 6} more bookings
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
