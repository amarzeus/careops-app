/**
 * Zod-powered API route validation wrapper.
 *
 * Usage:
 * ```ts
 * import { withValidation } from "@/lib/api-validation";
 * import { z } from "zod";
 *
 * const schema = z.object({ email: z.string().email(), name: z.string().min(1) });
 *
 * export const POST = withValidation(schema, async (req, data) => {
 *   // `data` is fully typed and validated
 *   return NextResponse.json({ ok: true });
 * });
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { type ZodSchema } from "zod";

/* eslint-disable @typescript-eslint/no-explicit-any */

type HandlerWithBody<T> = (req: NextRequest, data: T) => Promise<NextResponse>;

/**
 * Wraps a Next.js API route handler with Zod body validation.
 * Returns 400 with structured errors on validation failure.
 * Returns 500 with safe error on unexpected failures.
 */
export function withValidation<T>(schema: ZodSchema<T>, handler: HandlerWithBody<T>) {
  return async (req: NextRequest, _context?: any): Promise<NextResponse> => {
    try {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      const result = schema.safeParse(body);

      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        return NextResponse.json(
          {
            error: "Validation failed",
            details: errors,
          },
          { status: 400 }
        );
      }

      return handler(req, result.data);
    } catch (error) {
      console.error("[API Validation Error]", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

/**
 * Wraps a Next.js API route handler with Zod query parameter validation.
 */
export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, query: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, _context?: any): Promise<NextResponse> => {
    try {
      const searchParams = Object.fromEntries(req.nextUrl.searchParams);
      const result = schema.safeParse(searchParams);

      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        return NextResponse.json(
          {
            error: "Invalid query parameters",
            details: errors,
          },
          { status: 400 }
        );
      }

      return handler(req, result.data);
    } catch (error) {
      console.error("[API Query Validation Error]", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
