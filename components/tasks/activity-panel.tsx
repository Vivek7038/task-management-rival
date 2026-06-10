"use client";

import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityQuery } from "@/lib/hooks/use-task-detail";
import type { ActivityEntry } from "@/lib/types";

const ACTION_LABELS: Record<ActivityEntry["action"], string> = {
  CREATED: "created this task",
  UPDATED: "updated this task",
  STATUS_CHANGED: "changed status",
  DELETED: "deleted this task",
  ATTACHMENT_ADDED: "added an attachment",
  ATTACHMENT_REMOVED: "removed an attachment",
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ActivityDetail({ entry }: { entry: ActivityEntry }) {
  const { action, metadata } = entry;
  if (action === "STATUS_CHANGED" && metadata) {
    const from = String(metadata.from ?? "").replace("_", " ");
    const to = String(metadata.to ?? "").replace("_", " ");
    return (
      <span className="text-xs text-muted-foreground">
        {" "}
        from <span className="font-medium text-foreground">{from}</span> to{" "}
        <span className="font-medium text-foreground">{to}</span>
      </span>
    );
  }
  if ((action === "ATTACHMENT_ADDED" || action === "ATTACHMENT_REMOVED") && metadata?.fileName) {
    return (
      <span className="text-xs text-muted-foreground">
        {" "}<span className="font-medium text-foreground">{String(metadata.fileName)}</span>
      </span>
    );
  }
  if (action === "UPDATED" && metadata?.diffs) {
    const diffs = metadata.diffs as Record<string, { from: unknown; to: unknown }>;
    const fields = Object.keys(diffs).join(", ");
    return (
      <span className="text-xs text-muted-foreground"> ({fields})</span>
    );
  }
  return null;
}

export function ActivityPanel({ taskId }: { taskId: string }) {
  const { data: activity, isLoading } = useActivityQuery(taskId);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Activity</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="size-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : !activity || activity.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-3">
          {[...activity].reverse().map((entry) => (
            <li key={entry.id} className="flex gap-2.5">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground uppercase">
                {entry.actor.name?.[0] ?? entry.actor.email[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs">
                  <span className="font-medium">{entry.actor.name || entry.actor.email}</span>{" "}
                  <span className="text-muted-foreground">{ACTION_LABELS[entry.action]}</span>
                  <ActivityDetail entry={entry} />
                </p>
                <time className="text-xs text-muted-foreground" dateTime={entry.createdAt}>
                  {formatRelative(entry.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
