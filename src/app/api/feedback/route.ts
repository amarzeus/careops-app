import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { emitSSE } from "@/app/api/events/route";

/**
 * POST — Submit feedback (public, token-based).
 * GET  — List feedback for workspace (authenticated).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      token: string;
      rating: number;
      npsScore?: number;
      comment?: string;
    };

    if (!body.token || !body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Valid token and rating (1-5) required" }, { status: 400 });
    }

    // Find booking by feedback token
    const existing = await prisma.feedback.findUnique({
      where: { token: body.token },
    });

    if (existing && existing.rating > 0) {
      return NextResponse.json({ error: "Feedback already submitted" }, { status: 409 });
    }

    if (existing) {
      // Update placeholder feedback
      const feedback = await prisma.feedback.update({
        where: { token: body.token },
        data: {
          rating: body.rating,
          npsScore: body.npsScore ?? null,
          comment: body.comment ?? null,
        },
      });

      emitSSE(feedback.workspaceId, "feedback.received", {
        feedbackId: feedback.id,
        rating: feedback.rating,
        npsScore: feedback.npsScore,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, feedbackId: feedback.id });
    }

    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

/**
 * GET — List feedback for workspace (authenticated).
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { workspaceId: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { workspaceId: user.workspaceId, rating: { gt: 0 } },
      include: {
        contact: { select: { name: true } },
        booking: { select: { date: true, service: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calculate NPS
    const npsScores = feedbacks.filter((f) => f.npsScore !== null).map((f) => f.npsScore!);
    const promoters = npsScores.filter((s) => s >= 9).length;
    const detractors = npsScores.filter((s) => s <= 6).length;
    const totalNPS = npsScores.length;
    const nps = totalNPS > 0 ? Math.round(((promoters - detractors) / totalNPS) * 100) : null;

    const avgRating =
      feedbacks.length > 0
        ? Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1))
        : null;

    return NextResponse.json({
      feedbacks,
      stats: {
        totalFeedbacks: feedbacks.length,
        averageRating: avgRating,
        npsScore: nps,
        promoters,
        detractors,
        passives: totalNPS - promoters - detractors,
      },
    });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}
