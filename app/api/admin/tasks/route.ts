import { apiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskListQuerySchema } from "@/lib/schemas/task";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = requireAdmin(async (req: NextRequest) => {
  const rawQuery = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = taskListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid query parameters", 400, parsed.error.issues);
  }

  const { status, q, sort, dir, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as Prisma.QueryMode } } : {}),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput = (() => {
    switch (sort) {
      case "due":
        return { dueDate: dir };
      case "priority":
        return { priority: dir };
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
        user: {
          select: { id: true, name: true, email: true },
        },
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
});
