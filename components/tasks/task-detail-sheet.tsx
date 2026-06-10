"use client";

import { useEffect, useRef } from "react";
import { X, Calendar, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AttachmentsPanel } from "@/components/tasks/attachments-panel";
import { ActivityPanel } from "@/components/tasks/activity-panel";
import { useTaskQuery } from "@/lib/hooks/use-task-detail";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

const PRIORITY_CLASSES: Record<Task["priority"], string> = {
  LOW: "text-blue-500",
  MEDIUM: "text-yellow-500",
  HIGH: "text-red-500",
};

const STATUS_BADGE_CLASSES: Record<Task["status"], string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_LABELS: Record<Task["status"], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

type Props = {
  taskId: string | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
};

export function TaskDetailSheet({ taskId, onClose, onEdit }: Props) {
  const open = Boolean(taskId);
  const { data: task, isLoading } = useTaskQuery(taskId);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Trap focus inside sheet when open
  useEffect(() => {
    if (open) sheetRef.current?.focus();
  }, [open]);

  const formattedDue = task?.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const isPastDue =
    task?.dueDate && task.status !== "DONE"
      ? new Date(task.dueDate) < new Date()
      : false;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Task detail"
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-xl outline-none transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">
            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              task?.title ?? "Task Detail"
            )}
          </h2>
          <div className="flex items-center gap-1">
            {task && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
              >
                Edit
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close panel"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ) : task ? (
            <>
              {/* Meta */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_BADGE_CLASSES[task.status]
                    )}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs",
                      PRIORITY_CLASSES[task.priority]
                    )}
                  >
                    <Flag className="size-3" />
                    {task.priority}
                  </span>
                  {formattedDue && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs",
                        isPastDue ? "text-red-500" : "text-muted-foreground"
                      )}
                    >
                      <Calendar className="size-3" />
                      {formattedDue}
                    </span>
                  )}
                </div>

                {task.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description.</p>
                )}
              </div>

              <hr className="border-border" />

              {/* Attachments */}
              <AttachmentsPanel taskId={task.id} />

              <hr className="border-border" />

              {/* Activity */}
              <ActivityPanel taskId={task.id} />
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          )}
        </div>
      </div>
    </>
  );
}
