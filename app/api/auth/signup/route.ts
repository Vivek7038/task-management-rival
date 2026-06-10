import { db } from "@/lib/db";
import { signupSchema } from "@/lib/schemas/auth";
import { setSessionCookie, signToken } from "@/lib/session";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const result = signupSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Bad Request", message: result.error.issues },
      { status: 400 }
    );
  }

  const { name, email, password } = result.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Conflict", message: "Email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const token = await signToken({ sub: user.id, email: user.email, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({ user }, { status: 201 });
}
