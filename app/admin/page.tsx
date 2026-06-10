"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; name: string; email: string };
}

interface TaskListResponse {
  items: AdminTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortField = "created" | "due" | "priority";
type SortDir = "asc" | "desc";

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function AdminPage() {
  const [data, setData] = useState<TaskListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [sort, setSort] = useState<SortField>("created");
  const [dir, setDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("sort", sort);
      params.set("dir", dir);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/tasks?${params.toString()}`);
      if (res.status === 401) {
        setError("You must be logged in.");
        return;
      }
      if (res.status === 403) {
        setError("Access denied. Admin only.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load tasks.");
        return;
      }
      const json: TaskListResponse = await res.json();
      setData(json);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort, dir, page]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function toggleSort(field: SortField) {
    if (sort === field) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setDir("desc");
    }
    setPage(1);
  }

  function SortIndicator({ field }: { field: SortField }) {
    if (sort !== field) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin — All Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Read-only view of all users&apos; tasks.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search by title…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 w-56 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as TaskStatus | ""); setPage(1); }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort("created")}
                  >
                    Status <SortIndicator field="created" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort("priority")}
                  >
                    Priority <SortIndicator field="priority" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort("due")}
                  >
                    Due <SortIndicator field="due" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort("created")}
                  >
                    Created <SortIndicator field="created" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No tasks found.
                    </td>
                  </tr>
                )}
                {data.items.map((task) => (
                  <tr key={task.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium">{task.title}</p>
                      {task.description && (
                        <p className="truncate text-xs text-muted-foreground">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{task.user.name}</p>
                      <p className="text-xs text-muted-foreground">{task.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : <span className="text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.total === 0
                ? "No tasks"
                : `Showing ${(page - 1) * data.limit + 1}–${Math.min(page * data.limit, data.total)} of ${data.total}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs">
                Page {page} of {data.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
