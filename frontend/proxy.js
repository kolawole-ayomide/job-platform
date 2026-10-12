import { NextResponse } from "next/server";

// Edge middleware can't verify the JWT (no access to JWT_SECRET here, and we
// don't want to duplicate it into a public env var), so this is a presence
// check only - a fast redirect for the common case. The backend's `protect`
// middleware remains the real authority on every API call.
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/get-started", "/jobs", "/wizbot", "/resume", "/assistant"];
const AUTH_ONLY_PREFIXES = ["/signin", "/signup"];

export function proxy(req) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !token) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/get-started/:path*",
    "/jobs/:path*",
    "/wizbot/:path*",
    "/resume/:path*",
    "/assistant/:path*",
    "/signin",
    "/signup",
  ],
};
