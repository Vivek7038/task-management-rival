import { apiError } from "@/lib/api-error";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { onAttachmentRemoved } from "@/lib/activity";
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; attId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id, attId } = await params;

  const task = await db.task.findFirst({
    where: { id, userId: user.id },
    select: { id: true, userId: true },
  });

  if (!task) {
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  const attachment = await db.attachment.findFirst({
    where: { id: attId, taskId: id },
    select: { id: true, blobUrl: true, fileName: true },
  });

  if (!attachment) {
    return apiError("NOT_FOUND", "Attachment not found", 404);
  }

  // Best-effort blob cleanup — don't block deletion if it fails
  try {
    await del(attachment.blobUrl);
  } catch (err) {
    console.error("Vercel Blob delete error (non-fatal):", err);
  }

  await db.attachment.delete({ where: { id: attId } });

  await onAttachmentRemoved(task.id, user.id, task.userId, {
    id: attachment.id,
    fileName: attachment.fileName,
  });

  return new NextResponse(null, { status: 204 });
}
