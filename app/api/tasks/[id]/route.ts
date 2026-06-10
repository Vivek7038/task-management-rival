import { apiError } from "@/lib/api-error";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskUpdateSchema } from "@/lib/schemas/task";
import { onTaskUpdated, onTaskDeleted } from "@/lib/activity";
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;

  const task = await db.task.findFirst({
    where: {
      id,
      // Non-admins can only see their own tasks; return 404 to avoid existence leak
      ...(user.role !== "ADMIN" ? { userId: user.id } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  });

  if (!task) {
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  return NextResponse.json({ task });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;

  // Fetch the task first to verify ownership and compute diffs
  const existing = await db.task.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
    },
  });

  if (!existing) {
    // Return 404 regardless of ownership to avoid existence leak
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  if (user.role !== "ADMIN" && existing.userId !== user.id) {
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("BAD_REQUEST", "Invalid JSON", 400);
  }

  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);
  }

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return apiError("BAD_REQUEST", "No fields to update", 400);
  }

  try {
    const task = await db.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    await onTaskUpdated(task.id, user.id, task.userId, data as Record<string, unknown>, existing);

    return NextResponse.json({ task });
  } catch (err) {
    console.error("PATCH /api/tasks/[id] error:", err);
    return apiError("INTERNAL_ERROR", "Failed to update task", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;

  const existing = await db.task.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  if (user.role !== "ADMIN" && existing.userId !== user.id) {
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  try {
    // Best-effort blob cleanup before cascade-delete removes attachment rows
    const attachments = await db.attachment.findMany({
      where: { taskId: id },
      select: { blobUrl: true },
    });
    if (attachments.length > 0) {
      await Promise.allSettled(attachments.map((a) => del(a.blobUrl)));
    }

    await onTaskDeleted(id, user.id, existing.userId);
    await db.task.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/tasks/[id] error:", err);
    return apiError("INTERNAL_ERROR", "Failed to delete task", 500);
  }
}
