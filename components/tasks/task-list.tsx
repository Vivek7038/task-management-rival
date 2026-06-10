"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TaskRow } from "@/components/tasks/task-row";
import type { Task, TaskFilters, TasksPage } from "@/lib/types";

type Props = {
  data: TasksPage | undefined;
  isLoading: boolean;
  isError: boolean;
  filters: TaskFilters;
  hasActiveFilters: boolean;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onRetry: () => void;
  onCreateFirst: () => void;
};

function TaskRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <Skeleton className="mt-0.5 size-5 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TaskList({
  data,
  isLoading,
  isError,
  filters,
  hasActiveFilters,
  onEdit,
  onView,
  onRetry,
  onCreateFirst,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <TaskRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load tasks"
        description="Something went wrong while fetching your tasks. Please try again."
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.items.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          title="No results found"
          description="No tasks match your current filters. Try adjusting the search or status filter."
        />
      );
    }
    return (
      <EmptyState
        title="No tasks yet"
        description="Create your first task to get started."
        action={
          <button
            type="button"
            onClick={onCreateFirst}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Create task
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {data.items.map((task) => (
        <TaskRow key={task.id} task={task} filters={filters} onEdit={onEdit} onView={onView} />
      ))}
    </div>
  );
}
