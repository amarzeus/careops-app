"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Public feedback form.
 */
export default function FeedbackPage() {
  const pathname = usePathname();
  const token = pathname.split("/").pop();

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          npsScore,
          comment,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      setStatus("success");
    } catch (e) {
      setErrorMessage((e as Error).message);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Thank You!</CardTitle>
            <CardDescription>Your feedback helps us improve our service.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">How was your visit?</CardTitle>
          <CardDescription>We&apos;d love to hear about your experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <div className="text-center text-sm font-medium text-red-500">{errorMessage}</div>
          )}

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate your experience</label>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:ring-primary rounded-full p-1 focus:ring-2 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* NPS Score */}
          {rating > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 space-y-2">
              <label className="text-sm font-medium">
                How likely are you to recommend us to a friend? (0-10)
              </label>
              <div className="flex justify-between">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setNpsScore(score)}
                    className={`flex h-8 w-8 items-center justify-center rounded-sm text-sm font-medium transition-colors ${
                      npsScore === score
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>
          )}

          {/* Comment */}
          {rating > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 space-y-2">
              <label className="flex items-center text-sm font-medium">
                <MessageSquare className="mr-2 h-4 w-4" />
                Additional comments (optional)
              </label>
              <Textarea
                placeholder="Tell us more about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={rating === 0 || status === "submitting"}
            onClick={handleSubmit}
          >
            {status === "submitting" ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
