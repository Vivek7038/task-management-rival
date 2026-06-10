"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Pencil, Trash2, Calendar, Flag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { Task, TaskFilters } from "@/lib/types";
import { useDeleteTask, useToggleTaskComplete } from "@/lib/hooks/use-tasks";

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
  task: Task;
  filters: TaskFilters;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
};

export function TaskRow({ task, filters, onEdit, onView }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toggleMutation = useToggleTaskComplete(filters);
  const deleteMutation = useDeleteTask(filters);

  const isDone = task.status === "DONE";
  const isToggling = toggleMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  function handleToggle() {
    toggleMutation.mutate({ id: task.id, currentStatus: task.status });
  }

  function handleDelete() {
    deleteMutation.mutate(task.id, {
      onSuccess: () => setConfirmOpen(false),
    });
  }

  const formattedDue = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const isPastDue =
    task.dueDate && task.status !== "DONE"
      ? new Date(task.dueDate) < new Date()
      : false;

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border bg-card p-3 transition-opacity",
          (isToggling || isDeleting) && "opacity-60"
        )}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={isToggling}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:pointer-events-none"
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        >
          {isDone ? (
            <CheckCircle2 className="size-5 text-green-500" />
          ) : (
            <Circle className="size-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "truncate text-sm font-medium leading-snug",
              isDone && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onView(task)}
            aria-label="View task detail"
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmOpen(true)}
            aria-label="Delete task"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
