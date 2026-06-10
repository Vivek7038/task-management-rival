import { db } from "@/lib/db";
import { eventBus } from "@/lib/event-bus";
import { Prisma } from "@prisma/client";

async function logActivity(params: {
  taskId: string;
  actorId: string;
  action: "CREATED" | "UPDATED" | "STATUS_CHANGED" | "DELETED" | "ATTACHMENT_ADDED" | "ATTACHMENT_REMOVED";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.activityLog.create({
    data: {
      taskId: params.taskId,
      actorId: params.actorId,
      action: params.action,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function onTaskCreated(
  taskId: string,
  actorId: string,
  taskUserId: string
): Promise<void> {
  await logActivity({ taskId, actorId, action: "CREATED" });
  eventBus.publish({ type: "task.created", taskId, taskUserId, actorId });
}

type ExistingTaskFields = {
  userId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
};

export async function onTaskUpdated(
  taskId: string,
  actorId: string,
  taskUserId: string,
  changes: Record<string, unknown>,
  existing: ExistingTaskFields
): Promise<void> {
  const { status: newStatus, ...otherChanges } = changes;

  // STATUS_CHANGED when status field differs from existing
  if (newStatus !== undefined && newStatus !== existing.status) {
    await logActivity({
      taskId,
      actorId,
      action: "STATUS_CHANGED",
      metadata: { from: existing.status, to: newStatus },
    });
  }

  // UPDATED for all other changed fields
  const diffs: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, newValue] of Object.entries(otherChanges)) {
    const oldValue = existing[key as keyof ExistingTaskFields];
    if (String(newValue) !== String(oldValue)) {
      diffs[key] = { from: oldValue ?? null, to: newValue };
    }
  }
  if (Object.keys(diffs).length > 0) {
    await logActivity({ taskId, actorId, action: "UPDATED", metadata: { diffs } });
  }

  eventBus.publish({
    type: "task.updated",
    taskId,
    taskUserId,
    actorId,
    metadata: changes,
  });
}

export async function onTaskDeleted(
  taskId: string,
  actorId: string,
  taskUserId: string
): Promise<void> {
  // Write activity record before the cascade-delete removes it
  await logActivity({ taskId, actorId, action: "DELETED" });
  eventBus.publish({ type: "task.deleted", taskId, taskUserId, actorId });
}

export async function onAttachmentAdded(
  taskId: string,
  actorId: string,
  taskUserId: string,
  attachment: { id: string; fileName: string; mimeType: string; sizeBytes: number }
): Promise<void> {
  await logActivity({
    taskId,
    actorId,
    action: "ATTACHMENT_ADDED",
    metadata: {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    },
  });
  eventBus.publish({
    type: "task.updated",
    taskId,
    taskUserId,
    actorId,
    metadata: { event: "ATTACHMENT_ADDED", attachmentId: attachment.id },
  });
}

export async function onAttachmentRemoved(
  taskId: string,
  actorId: string,
  taskUserId: string,
  attachment: { id: string; fileName: string }
): Promise<void> {
  await logActivity({
    taskId,
    actorId,
    action: "ATTACHMENT_REMOVED",
    metadata: { attachmentId: attachment.id, fileName: attachment.fileName },
  });
  eventBus.publish({
    type: "task.updated",
    taskId,
    taskUserId,
    actorId,
    metadata: { event: "ATTACHMENT_REMOVED", attachmentId: attachment.id },
  });
}
