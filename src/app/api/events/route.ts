import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Global event emitter for SSE — allows other API routes to push events.
 */
type SSEListener = (event: string, data: unknown) => void;
const listeners = new Map<string, Set<SSEListener>>();

/**
 * Emit an event to all connected clients for a workspace.
 */
export function emitSSE(workspaceId: string, event: string, data: unknown): void {
  const wsListeners = listeners.get(workspaceId);
  if (wsListeners) {
    for (const listener of wsListeners) {
      listener(event, data);
    }
  }
}

/**
 * SSE endpoint — streams real-time workspace events to the dashboard.
 */
export async function GET(req: NextRequest) {
  // Authenticate
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return new Response("Invalid token", { status: 401 });
  }

  // Get workspace
  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    return new Response("No workspace", { status: 400 });
  }

  const workspaceId = user.workspaceId;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial heartbeat
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
        )
      );

      // Register listener
      const listener: SSEListener = (event, data) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected
        }
      };

      if (!listeners.has(workspaceId)) {
        listeners.set(workspaceId, new Set());
      }
      listeners.get(workspaceId)!.add(listener);

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${new Date().toISOString()}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        listeners.get(workspaceId)?.delete(listener);
        if (listeners.get(workspaceId)?.size === 0) {
          listeners.delete(workspaceId);
        }
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
