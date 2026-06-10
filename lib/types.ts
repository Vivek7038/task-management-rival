export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type TasksPage = {
  items: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TaskFilters = {
  status?: TaskStatus;
  q?: string;
  sort?: "due" | "priority" | "created";
  dir?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blobUrl: string;
  createdAt: string;
};

export type ActivityEntry = {
  id: string;
  action: "CREATED" | "UPDATED" | "STATUS_CHANGED" | "DELETED" | "ATTACHMENT_ADDED" | "ATTACHMENT_REMOVED";
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string; email: string };
};
