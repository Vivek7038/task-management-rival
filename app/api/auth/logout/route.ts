import { clearSessionCookie } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ message: "Logged out successfully" });
}
