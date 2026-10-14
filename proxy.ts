import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Host-based routing. Caddy forwards the original Host header, so:
//   admin.limitlezz.online/*   -> app/admin/*  (admin dashboard)
//   joblezz.limitlezz.online/* -> app/*        (user-facing site)
const ADMIN_HOST = "admin.";
const ADMIN_PREFIX = "/admin";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (host.startsWith(ADMIN_HOST)) {
    if (pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `${ADMIN_PREFIX}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // The admin dashboard is only reachable through its own subdomain.
  if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes (incl. /api/health), Next.js assets and public files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
