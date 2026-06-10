"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Task, TaskFilters, TasksPage } from "@/lib/types";

function buildParams(filters: TaskFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.status) p.set("status", filters.status);
  if (filters.q) p.set("q", filters.q);
  if (filters.sort) p.set("sort", filters.sort);
  if (filters.dir) p.set("dir", filters.dir);
  if (filters.page) p.set("page", String(filters.page));
  if (filters.limit) p.set("limit", String(filters.limit));
  return p;
}

export function useTasksQuery(filters: TaskFilters) {
  return useQuery<TasksPage>({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?${buildParams(filters)}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      status?: Task["status"];
      priority?: Task["priority"];
      dueDate?: string | null;
    }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Failed to create task");
      }
      const json = await res.json();
      return json.task as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string | null;
      status?: Task["status"];
      priority?: Task["priority"];
      dueDate?: string | null;
    }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Failed to update task");
      }
      const json = await res.json();
      return json.task as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update task");
    },
  });
}

export function useToggleTaskComplete(filters: TaskFilters) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: Task["status"] }) => {
      const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Failed to update task");
      }
      const json = await res.json();
      return json.task as Task;
    },
    onMutate: async ({ id, currentStatus }) => {
      await qc.cancelQueries({ queryKey: ["tasks", filters] });
      const previous = qc.getQueryData<TasksPage>(["tasks", filters]);
      const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
      if (previous) {
        qc.setQueryData<TasksPage>(["tasks", filters], {
          ...previous,
          items: previous.items.map((t) =>
            t.id === id ? { ...t, status: newStatus } : t
          ),
        });
      }
      return { previous };
    },
    onError: (_err: Error, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["tasks", filters], ctx.previous);
      }
      toast.error("Failed to update task status. Changes rolled back.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask(filters: TaskFilters) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Failed to delete task");
      }
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks", filters] });
      const previous = qc.getQueryData<TasksPage>(["tasks", filters]);
      if (previous) {
        qc.setQueryData<TasksPage>(["tasks", filters], {
          ...previous,
          items: previous.items.filter((t) => t.id !== id),
          total: previous.total - 1,
        });
      }
      return { previous };
    },
    onError: (_err: Error, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["tasks", filters], ctx.previous);
      }
      toast.error("Failed to delete task. Changes rolled back.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
