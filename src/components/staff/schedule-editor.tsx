"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface StaffScheduleEditorProps {
  userId: string;
  userName: string;
}

const DEFAULT_SCHEDULE: ScheduleEntry[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "17:00",
  isAvailable: i >= 1 && i <= 5, // Mon-Fri default
}));

/**
 * Editor for managing staff member weekly availability.
 */
export function StaffScheduleEditor({ userId, userName }: StaffScheduleEditorProps) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/schedule?userId=${userId}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.schedule && data.schedule.length > 0) {
        // Merge fetched entries with defaults for any missing days
        const merged = DEFAULT_SCHEDULE.map((def) => {
          const found = data.schedule.find((s: ScheduleEntry) => s.dayOfWeek === def.dayOfWeek);
          return found
            ? {
                dayOfWeek: found.dayOfWeek,
                startTime: found.startTime,
                endTime: found.endTime,
                isAvailable: found.isAvailable,
              }
            : def;
        });
        setSchedule(merged);
      }
    } catch {
      // silently use defaults
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleToggle = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((e) => (e.dayOfWeek === dayOfWeek ? { ...e, isAvailable: !e.isAvailable } : e))
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: "startTime" | "endTime", value: string) => {
    setSchedule((prev) =>
      prev.map((e) => (e.dayOfWeek === dayOfWeek ? { ...e, [field]: value } : e))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, entries: schedule }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Saved", description: `Schedule updated for ${userName}` });
    } catch {
      toast({
        title: "Error",
        description: "Could not save schedule",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4" />
          {userName}&rsquo;s Weekly Schedule
        </h4>
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 gap-1.5">
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save
        </Button>
      </div>

      <div className="grid gap-2">
        {schedule.map((entry) => (
          <div
            key={entry.dayOfWeek}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
              entry.isAvailable
                ? "border-primary/20 bg-primary/5"
                : "border-muted bg-muted/30 opacity-60"
            }`}
          >
            <button
              onClick={() => handleToggle(entry.dayOfWeek)}
              className={`h-5 w-5 shrink-0 rounded border-2 transition-colors ${
                entry.isAvailable ? "border-primary bg-primary" : "border-muted-foreground/40"
              }`}
              aria-label={`Toggle ${DAYS[entry.dayOfWeek]}`}
            >
              {entry.isAvailable && (
                <svg
                  className="h-full w-full text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <span className="w-24 text-sm font-medium">{DAYS[entry.dayOfWeek]}</span>

            {entry.isAvailable && (
              <div className="flex items-center gap-1.5 text-sm">
                <input
                  type="time"
                  value={entry.startTime}
                  onChange={(e) => handleTimeChange(entry.dayOfWeek, "startTime", e.target.value)}
                  className="bg-background rounded border px-2 py-1 text-xs"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="time"
                  value={entry.endTime}
                  onChange={(e) => handleTimeChange(entry.dayOfWeek, "endTime", e.target.value)}
                  className="bg-background rounded border px-2 py-1 text-xs"
                />
              </div>
            )}

            {!entry.isAvailable && (
              <span className="text-muted-foreground text-xs italic">Day off</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
