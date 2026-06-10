"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TaskEvent } from "@/lib/event-bus";

export function useSSE() {
  const qc = useQueryClient();

  useEffect(() => {
    const es = new EventSource("/api/stream");

    es.onmessage = (e) => {
      try {
        const event: TaskEvent = JSON.parse(e.data);

        // Refresh the task lists
        qc.invalidateQueries({ queryKey: ["tasks"] });

        // Refresh task-specific data
        qc.invalidateQueries({ queryKey: ["task", event.taskId] });
        qc.invalidateQueries({ queryKey: ["attachments", event.taskId] });
        qc.invalidateQueries({ queryKey: ["activity", event.taskId] });
      } catch {
        // Non-JSON comment lines (ping/connected) are ignored
      }
    };

    es.onerror = () => {
      // Browser auto-reconnects on error; nothing extra needed
    };

    return () => {
      es.close();
    };
  }, [qc]);
}
