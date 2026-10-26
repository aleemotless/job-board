import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_BASE_PATH } from "@/lib/config";

// Host-based routing. Caddy forwards the original Host header, so:
//   admin.limitlezz.online/*           -> app/admin/*  (admin dashboard)
//   admin-staging.limitlezz.online/*   -> app/admin/*  (staging admin dashboard)
//   joblezz(-staging).limitlezz.online -> app/*        (user-facing site)
// First DNS label is "admin" or "admin-<env>" (e.g. admin.localhost, admin-staging.example.com).
function isAdminHost(host: string) {
  const label = host.split(".")[0];
  return label === "admin" || label.startsWith("admin-");
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (isAdminHost(host)) {
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
}

export const config = {
  // Skip API routes (incl. /api/health), Next.js assets and public files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
