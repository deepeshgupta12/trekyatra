import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "trekyatra_access_token";

const PROTECTED_PREFIXES = ["/account"];
const ADMIN_PREFIXES = ["/admin"];
const GUEST_ONLY_PREFIXES = ["/auth/sign-in", "/auth/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAdminRoute = ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isGuestOnly = GUEST_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  // Admin routes: must be authenticated (role check is enforced by FastAPI backend)
  if (isAdminRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isGuestOnly && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/auth/sign-in", "/auth/sign-up"],
};
