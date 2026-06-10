import { apiError } from "@/lib/api-error";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskCreateSchema, taskListQuerySchema } from "@/lib/schemas/task";
import { onTaskCreated } from "@/lib/activity";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const rawQuery = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = taskListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid query parameters", 400, parsed.error.issues);
  }

  const { status, q, sort, dir, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = {
    userId: user.role === "ADMIN" ? undefined : user.id,
    ...(status ? { status } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as Prisma.QueryMode } } : {}),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput = (() => {
    switch (sort) {
      case "due":
        return { dueDate: dir };
      case "priority": {
        // Map priority enum to a custom sort via raw or use a deterministic field
        // Prisma doesn't natively sort enums by semantic order; sort by priority string order as fallback
        return { priority: dir };
      }
      case "created":
      default:
        return { createdAt: dir };
    }
  })();

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
    }),
    db.task.count({ where }),
  ]);

  return NextResponse.json({
    items: tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("BAD_REQUEST", "Invalid JSON", 400);
  }

  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);
  }

  const { title, description, status, priority, dueDate } = parsed.data;

  try {
    const task = await db.task.create({
      data: {
        title,
        description,
        status: status ?? "TODO",
        priority: priority ?? "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.id,
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

    await onTaskCreated(task.id, user.id, task.userId);

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return apiError("INTERNAL_ERROR", "Failed to create task", 500);
  }
}
