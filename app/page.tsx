"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskToolbar } from "@/components/tasks/task-toolbar";
import { TaskList } from "@/components/tasks/task-list";
import { TaskModal } from "@/components/tasks/task-modal";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { Pagination } from "@/components/tasks/pagination";
import { useTasksQuery } from "@/lib/hooks/use-tasks";
import { useSSE } from "@/lib/hooks/use-sse";
import type { Task, TaskFilters } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DEFAULT_FILTERS: TaskFilters = {
  sort: "created",
  dir: "desc",
  page: 1,
  limit: 20,
};

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  useSSE();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const { data, isLoading, isError, refetch } = useTasksQuery(filters);

  function updateFilters(partial: Partial<TaskFilters>) {
    setFilters((f) => ({ ...f, ...partial }));
  }

  function openCreate() {
    setEditTask(null);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setModalOpen(true);
  }

  function openDetail(task: Task) {
    setDetailTaskId(task.id);
  }

  function closeDetail() {
    setDetailTaskId(null);
  }

  const hasActiveFilters = Boolean(filters.status || filters.q);

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          {data && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {data.total} {data.total === 1 ? "task" : "tasks"}
            </p>
          )}
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0">
          <Plus className="size-4" />
          New task
        </Button>
      </div>

      <div className="space-y-4">
        <TaskToolbar filters={filters} onFiltersChange={updateFilters} />

        <TaskList
          data={data}
          isLoading={isLoading}
          isError={isError}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onEdit={openEdit}
          onView={openDetail}
          onRetry={() => refetch()}
          onCreateFirst={openCreate}
        />

        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            limit={data.limit}
            onPageChange={(p) => updateFilters({ page: p })}
          />
        )}
      </div>

      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editTask}
      />

      <TaskDetailSheet
        taskId={detailTaskId}
        onClose={closeDetail}
        onEdit={(task) => {
          closeDetail();
          openEdit(task);
        }}
      />
    </main>
  );
}
