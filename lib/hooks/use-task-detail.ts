"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ActivityEntry, Attachment, Task } from "@/lib/types";

export function useTaskQuery(id: string | null) {
  return useQuery<Task>({
    queryKey: ["task", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      const json = await res.json();
      return json.task as Task;
    },
  });
}

export function useAttachmentsQuery(taskId: string | null) {
  return useQuery<Attachment[]>({
    queryKey: ["attachments", taskId],
    enabled: Boolean(taskId),
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      if (!res.ok) throw new Error("Failed to fetch attachments");
      const json = await res.json();
      return json.attachments as Attachment[];
    },
  });
}

export function useActivityQuery(taskId: string | null) {
  return useQuery<ActivityEntry[]>({
    queryKey: ["activity", taskId],
    enabled: Boolean(taskId),
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/activity`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const json = await res.json();
      return json.activity as ActivityEntry[];
    },
  });
}

export function useUploadAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Upload failed");
      }
      const json = await res.json();
      return json.attachment as Attachment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
      qc.invalidateQueries({ queryKey: ["activity", taskId] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Upload failed");
    },
  });
}

export function useDeleteAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/attachments/${attId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Delete failed");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
      qc.invalidateQueries({ queryKey: ["activity", taskId] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete attachment");
    },
  });
}
