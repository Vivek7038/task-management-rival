import { apiError } from "@/lib/api-error";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { onAttachmentAdded } from "@/lib/activity";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB per file
const MAX_TOTAL_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB total across a task's attachments

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

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
      ...(user.role !== "ADMIN" ? { userId: user.id } : {}),
    },
    select: { id: true, userId: true },
  });

  if (!task) {
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  const attachments = await db.attachment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      blobUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ attachments });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;

  const task = await db.task.findFirst({
    where: { id, userId: user.id },
    select: { id: true, userId: true },
  });

  if (!task) {
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError("BAD_REQUEST", "Invalid form data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError("VALIDATION_ERROR", "Field 'file' is required", 400);
  }

  if (file.size === 0) {
    return apiError("VALIDATION_ERROR", "File must not be empty", 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return apiError(
      "VALIDATION_ERROR",
      `File exceeds the maximum size of ${formatMb(MAX_FILE_SIZE_BYTES)} (received ${formatMb(file.size)})`,
      400
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return apiError(
      "VALIDATION_ERROR",
      `File type '${mimeType}' is not allowed. Accepted: images, PDF, DOC, DOCX, TXT`,
      400
    );
  }

  // Enforce a per-task total: the sum of existing attachments plus this file
  // must not exceed MAX_TOTAL_SIZE_BYTES.
  const existing = await db.attachment.aggregate({
    where: { taskId: task.id },
    _sum: { sizeBytes: true },
  });
  const usedBytes = existing._sum.sizeBytes ?? 0;
  if (usedBytes + file.size > MAX_TOTAL_SIZE_BYTES) {
    const remaining = Math.max(0, MAX_TOTAL_SIZE_BYTES - usedBytes);
    return apiError(
      "VALIDATION_ERROR",
      `Total attachment size for this task is limited to ${formatMb(MAX_TOTAL_SIZE_BYTES)}. ` +
        `Already used ${formatMb(usedBytes)}; ${formatMb(remaining)} remaining, but this file is ${formatMb(file.size)}.`,
      400
    );
  }

  let blobResult: { url: string };
  try {
    blobResult = await put(`tasks/${task.id}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
  } catch (err) {
    console.error("Vercel Blob upload error:", err);
    return apiError("INTERNAL_ERROR", "Failed to upload file", 500);
  }

  const attachment = await db.attachment.create({
    data: {
      taskId: task.id,
      blobUrl: blobResult.url,
      fileName: file.name,
      mimeType,
      sizeBytes: file.size,
    },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      blobUrl: true,
      createdAt: true,
    },
  });

  await onAttachmentAdded(task.id, user.id, task.userId, {
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
  });

  return NextResponse.json({ attachment }, { status: 201 });
}
