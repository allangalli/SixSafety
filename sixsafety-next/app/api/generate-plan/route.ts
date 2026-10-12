/**
 * Server-Sent Events (SSE) API Route for Safety Plan Generation
 * Streams real-time updates as the RAG workflow executes
 */

import { streamSafetyPlan } from "@/lib/rag/workflow";
import type { RAGInput } from "@/types/rag";
import { NextRequest } from "next/server";
import {
  getPlanGenerationLimiter,
  getIdentifier,
  formatResetTime,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/generate-plan
 * Accepts RAGInput in request body, streams safety plan generation
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getIdentifier(request);
    const limiter = getPlanGenerationLimiter();
    const rateLimit = limiter.check(identifier);

    if (rateLimit.limited) {
      const retryAfter = formatResetTime(rateLimit.resetTime);
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          retryAfter: parseInt(retryAfter),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter,
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetTime.toString(),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const input: RAGInput = {
      neighbourhood: body.neighbourhood,
      crime_types: body.crime_types || [],
      user_context: body.user_context || [],
    };

    // Validate input
    if (!input.neighbourhood) {
      return new Response(
        JSON.stringify({ error: "Neighbourhood is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream RAG workflow execution
          for await (const event of streamSafetyPlan(input)) {
            // Format as SSE event
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Close stream
          controller.close();
        } catch (error) {
          console.error("[SSE] Stream error:", error);

          // Send error event
          const errorEvent = {
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to generate safety plan",
          };
          const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[API] Request error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to process request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
