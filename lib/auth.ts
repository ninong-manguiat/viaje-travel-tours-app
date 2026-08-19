import { NextRequest, NextResponse } from "next/server";

export function requireRole(request: NextRequest, role: "client" | "admin") {
  const sessionRole = request.cookies.get("viaje-role")?.value;
  if (!sessionRole) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionRole !== role && sessionRole !== "admin") {
    return NextResponse.redirect(new URL(role === "admin" ? "/" : "/login", request.url));
  }

  return NextResponse.next();
}
