import { getSessionFromRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_ROUTES = [
  "/api/auth/signup",
  "/api/auth/login",
];

const PUBLIC_PAGE_ROUTES = [
  "/login",
  "/signup",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicApiRoute = PUBLIC_API_ROUTES.some((r) => pathname === r);
  const isPublicPageRoute = PUBLIC_PAGE_ROUTES.some((r) => pathname === r);
  const isApiRoute = pathname.startsWith("/api/");
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  if (isPublicPageRoute) {
    return NextResponse.next();
  }

  if (isApiRoute || (!isPublicPageRoute && !isPublicApiRoute)) {
    const session = await getSessionFromRequest(request);

    if (!session) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminPage && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
