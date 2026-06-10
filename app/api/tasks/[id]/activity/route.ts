import { apiError } from "@/lib/api-error";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;

  // Verify the task exists and the caller is allowed to view it
  const task = await db.task.findFirst({
    where: {
      id,
      ...(user.role !== "ADMIN" ? { userId: user.id } : {}),
    },
    select: { id: true },
  });

  if (!task) {
    return apiError("NOT_FOUND", "Task not found", 404);
  }

  const activity = await db.activityLog.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      action: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({ activity });
}
