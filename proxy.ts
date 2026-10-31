import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { ADMIN_BASE_PATH, SIGN_IN_PATH } from "@/lib/config";
import { isAdminHost } from "@/lib/hosts";

// Reads and verifies the session JWT only; see lib/auth.config.ts.
const { auth } = NextAuth(authConfig);

// Admin hosts are rewritten to app/admin/* for admins only; see lib/hosts.ts.
export const proxy = auth((request) => {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (isAdminHost(host)) {
    // Session cookies belong to the host that set them, so admins sign in on the admin host itself.
    if (pathname === SIGN_IN_PATH) return NextResponse.next();

    // The role comes from the verified JWT, set at sign-in from the user's `role` in the database.
    // Built from the forwarded headers: request.nextUrl has the upstream host, not the one the browser asked for.
    if (!request.auth) {
      const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
      return NextResponse.redirect(`${protocol}://${host}${SIGN_IN_PATH}`);
    }
    if (request.auth.user.role !== "admin") return new NextResponse(null, { status: 403 });

    if (pathname.startsWith(ADMIN_BASE_PATH)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `${ADMIN_BASE_PATH}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // The admin dashboard is only reachable through its own subdomain.
  if (pathname === ADMIN_BASE_PATH || pathname.startsWith(`${ADMIN_BASE_PATH}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
});

export const config = {
  // Skip API routes (incl. /api/health), Next.js assets and public files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
