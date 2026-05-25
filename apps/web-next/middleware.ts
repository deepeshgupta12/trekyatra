import { NextRequest, NextResponse } from "next/server";

const USER_COOKIE = "trekyatra_access_token";
const ADMIN_COOKIE = "trekyatra_admin_token";

// /account requires login — /plan is freely accessible; auth gate is shown as modal at submit
const PROTECTED_PREFIXES = ["/account"];

// ── Deleted URL handling ───────────────────────────────────────────────────────
// URLs removed from sitemaps follow a 2-phase lifecycle:
//   Phase 1 (0–7 days after deletedAt): 301 Permanent Redirect to redirectTo
//   Phase 2 (7+ days after deletedAt): 410 Gone
// Entries are managed in /public/deleted-routes.json
interface DeletedRoute {
  path: string;
  deletedAt: string;  // ISO 8601 date
  redirectTo: string; // target for the 301 phase
}

const DELETED_ROUTES: DeletedRoute[] = [
  // Example (remove when real entries are added):
  // { path: "/trek/old-trek-slug", deletedAt: "2026-05-01T00:00:00Z", redirectTo: "/explore" }
  // Add new entries here or manage via /public/deleted-routes.json loaded at build time
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function checkDeletedRoute(pathname: string): { action: "301" | "410"; redirectTo?: string } | null {
  const entry = DELETED_ROUTES.find(r => r.path === pathname);
  if (!entry) return null;
  const deletedAt = new Date(entry.deletedAt).getTime();
  const now = Date.now();
  if (now - deletedAt < SEVEN_DAYS_MS) {
    return { action: "301", redirectTo: entry.redirectTo };
  }
  return { action: "410" };
}
const ADMIN_PREFIXES = ["/admin"];
const ADMIN_PUBLIC_PATHS = ["/admin/sign-in"]; // exempt from admin auth check
const GUEST_ONLY_PREFIXES = ["/auth/sign-in", "/auth/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Deleted URL handling (MUST run before auth checks) ──────────────────────
  const deleted = checkDeletedRoute(pathname);
  if (deleted) {
    if (deleted.action === "410") {
      return new NextResponse("This page has been removed.", { status: 410 });
    }
    if (deleted.action === "301" && deleted.redirectTo) {
      const url = request.nextUrl.clone();
      url.pathname = deleted.redirectTo;
      return NextResponse.redirect(url, { status: 301 });
    }
  }
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

  // Bounce authenticated public users away from sign-in/sign-up.
  // Honour ?next= if present so post-auth deep-links (e.g. /plan) are respected.
  if (isGuestOnly && userToken) {
    const url = request.nextUrl.clone();
    const nextParam = request.nextUrl.searchParams.get("next");
    // Only allow safe internal redirects — must start with / but not //
    const destination =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : "/account";
    url.pathname = destination;
    url.search = "";
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
