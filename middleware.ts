import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return requireRole(request, "admin");
  }

  if (pathname.startsWith("/dashboard")) {
    if (pathname.startsWith("/dashboard/bookings/")) return;
    return requireRole(request, "client");
  }
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"]
};
