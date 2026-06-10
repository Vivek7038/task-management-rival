import { db } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionFromCookies();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  return user as CurrentUser | null;
}

export function requireAuth(
  handler: (req: NextRequest, user: CurrentUser) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    return handler(req, user);
  };
}

export function requireAdmin(
  handler: (req: NextRequest, user: CurrentUser) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }
    return handler(req, user);
  };
}

export function ownerOrAdmin(resourceOwnerId: string, user: CurrentUser): boolean {
  return user.id === resourceOwnerId || user.role === "ADMIN";
}

export function assertOwner(
  resourceOwnerId: string,
  user: CurrentUser
): NextResponse | null {
  if (user.id !== resourceOwnerId && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden", message: "Access denied" },
      { status: 403 }
    );
  }
  return null;
}

export function ownerScope(userId: string, user: CurrentUser): { userId: string } | object {
  if (user.role === "ADMIN") return {};
  return { userId };
}
