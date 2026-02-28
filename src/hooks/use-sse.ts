"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/** Shape of an SSE event received from the server. */
export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface UseSSEOptions {
  /** Whether the connection should be active. Defaults to `true`. */
  enabled?: boolean;
  /** Called for every event. */
  onEvent?: (event: SSEEvent) => void;
}

/**
 * React hook that connects to the `/api/events` SSE endpoint.
 * Auto-reconnects on disconnect with exponential back-off (max 30s).
 */
export function useSSE(options: UseSSEOptions = {}) {
  const { enabled = true, onEvent } = options;
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryRef = useRef(1_000);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const es = new EventSource("/api/events");
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      retryRef.current = 1_000; // reset backoff
    };

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as Record<string, unknown>;
        const event: SSEEvent = {
          type: (parsed.type as string) || "message",
          data: parsed,
          timestamp: (parsed.timestamp as string) || new Date().toISOString(),
        };
        setLastEvent(event);
        onEventRef.current?.(event);
      } catch {
        // Ignore unparseable data (heartbeats etc.)
      }
    };

    // Named events (booking.created, message.received, etc.)
    const eventTypes = [
      "booking.created",
      "booking.updated",
      "message.received",
      "inventory.low",
      "automation.completed",
      "feedback.received",
    ];

    for (const eventType of eventTypes) {
      es.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as Record<string, unknown>;
          const event: SSEEvent = {
            type: eventType,
            data,
            timestamp: new Date().toISOString(),
          };
          setLastEvent(event);
          onEventRef.current?.(event);
        } catch {
          // Ignore
        }
      });
    }

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Reconnect with backoff
      const delay = Math.min(retryRef.current, 30_000);
      retryRef.current = delay * 2;
      setTimeout(() => {
        if (enabled) connect();
      }, delay);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [enabled, connect]);

  return { connected, lastEvent };
}
