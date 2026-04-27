import { NextRequest, NextResponse } from "next/server";

const USER_COOKIE = "trekyatra_access_token";
const ADMIN_COOKIE = "trekyatra_admin_token";

const PROTECTED_PREFIXES = ["/account"];
const ADMIN_PREFIXES = ["/admin"];
const ADMIN_PUBLIC_PATHS = ["/admin/sign-in"]; // exempt from admin auth check
const GUEST_ONLY_PREFIXES = ["/auth/sign-in", "/auth/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userToken = request.cookies.get(USER_COOKIE)?.value;
  const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;

  const isAdminPublic = ADMIN_PUBLIC_PATHS.includes(pathname);
  const isAdminRoute = !isAdminPublic && ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isGuestOnly = GUEST_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  // Admin routes: must have admin token (trekyatra_admin_token), NOT the public user token
  if (isAdminRoute && !adminToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Public account routes: must have user token (trekyatra_access_token)
  if (isProtected && !userToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Bounce authenticated public users away from sign-in/sign-up
  if (isGuestOnly && userToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/auth/sign-in",
    "/auth/sign-up",
  ],
};
