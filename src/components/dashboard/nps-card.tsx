"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Frown, Meh, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NPSCardProps {
  npsScore: number | null;
  totalFeedbacks: number;
  promoters: number;
  passives: number;
  detractors: number;
  averageRating: number | null;
  loading?: boolean;
}

/**
 * Displays NPS summary metrics.
 *
 * @param props Props
 */
export function NPSCard({
  npsScore,
  totalFeedbacks,
  promoters,
  passives,
  detractors,
  averageRating,
  loading = false,
}: NPSCardProps) {
  if (loading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-500";
    if (score >= 70) return "text-green-500";
    if (score >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreText = (score: number | null) => {
    if (score === null) return "N/A";
    if (score >= 70) return "Excellent";
    if (score >= 30) return "Good";
    if (score > 0) return "Needs Improvement";
    return "Critical";
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Customer Sentiment (NPS)</CardTitle>
        <Heart className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className={`text-5xl font-bold ${getScoreColor(npsScore)}`}>
              {npsScore !== null ? npsScore : "--"}
            </span>
            <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              {getScoreText(npsScore)}
            </span>
            {averageRating && (
              <span className="text-muted-foreground mt-1 text-xs">
                Avg Rating: {averageRating} / 5
              </span>
            )}
          </div>

          <div className="w-full flex-1 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center font-medium text-green-600">
                  <Smile className="mr-1 h-4 w-4" /> Promoters (9-10)
                </span>
                <span className="font-bold">{promoters}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${totalFeedbacks ? (promoters / totalFeedbacks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center font-medium text-yellow-600">
                  <Meh className="mr-1 h-4 w-4" /> Passives (7-8)
                </span>
                <span className="font-bold">{passives}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{ width: `${totalFeedbacks ? (passives / totalFeedbacks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center font-medium text-red-600">
                  <Frown className="mr-1 h-4 w-4" /> Detractors (0-6)
                </span>
                <span className="font-bold">{detractors}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${totalFeedbacks ? (detractors / totalFeedbacks) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
