import { apiError } from "@/lib/api-error";
import { getCurrentUser } from "@/lib/auth";
import { eventBus } from "@/lib/event-bus";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Send a keep-alive comment every 25 s so Vercel / proxies don't close idle connections
const PING_MS = 25_000;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const isAdmin = user.role === "ADMIN";
  const encoder = new TextEncoder();
  let pingTimer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      eventBus.subscribe(user.id, isAdmin, controller);

      // Confirm connection to the client
      controller.enqueue(encoder.encode(": connected\n\n"));

      pingTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingTimer);
        }
      }, PING_MS);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingTimer);
        eventBus.unsubscribe(user.id, isAdmin, controller);
        try {
          controller.close();
        } catch {
          // already closed — nothing to do
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
