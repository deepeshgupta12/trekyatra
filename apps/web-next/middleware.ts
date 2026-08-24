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
// ── SEO: 410 Gone catch-all for agent-hallucinated dead root URLs ──────────────
// Content agents historically emitted invented internal links to root-level slugs that were never
// real pages (/pahalgam-travel-guide, /budget-trekking-india, /parvati-valley-trek, …). The content
// is now cleaned, but Google permanently remembers those URLs and keeps re-retrying the 404s, so they
// linger in Search Console. A plain 404 says "try again later"; a 410 says "gone — drop it", which
// de-indexes fastest. This is a DURABLE catch-all (chosen 2026-08-24) so we no longer hand-curate a
// redirect per slug: any single-segment root path that is "content-shaped" (>=2 hyphens — verified that
// NO real root route matches this; the only >=2-hyphen route is the hi-trek-sitemap.xml FILE, excluded
// by the matcher) and is neither a real route nor a curated 301 source → 410.
//
// Real single-segment root routes (0–1 hyphens; belt-and-suspenders, the hyphen gate already spares them).
const REAL_ROOT_ROUTES = new Set([
  "/about", "/account", "/admin", "/affiliate-disclosure", "/app", "/auth", "/beginner", "/challenging",
  "/checkout", "/compare", "/contact", "/costs", "/datacenter", "/empty-saved", "/explore", "/gear",
  "/guides", "/hi", "/itineraries", "/maintenance", "/methodology", "/moderate", "/news", "/newsletter",
  "/no-results", "/operators", "/packing", "/permits", "/plan", "/premium", "/privacy", "/products",
  "/regions", "/safety", "/safety-disclaimer", "/saved", "/search", "/seasons", "/success", "/terms",
  "/trek", "/trek-types", "/trekker", "/treksage", "/under-review",
]);
// Root slugs that next.config.mjs 301-redirects (legacyArticleRedirects + bareIndexRedirects). Middleware
// runs BEFORE next.config redirects, so the 410 catch-all MUST skip these or it would 410 them before the
// redirect fires. FROZEN: new dead root slugs are handled by the 410 catch-all — do NOT keep growing the
// next.config list. If a root-slug redirect IS ever added to next.config.mjs, add its source here too.
const REDIRECTED_ROOT_SLUGS = new Set([
  "/roopkund-trek-complete-guide", "/best-treks-uttarakhand", "/best-trekking-gear-india",
  "/high-altitude-trekking-gear-india", "/what-to-pack-for-a-himalayan-trek", "/trekking-packing-list-india",
  "/himachal-pradesh-trekking-permits-guide", "/how-to-get-inner-line-permit-ladakh",
  "/altitude-sickness-prevention-guide", "/high-altitude-trekking-tips", "/high-altitude-trekking-fitness-guide",
  "/leh-acclimatisation-guide", "/ladakh-winter-travel-tips", "/alchi-monastery-guide", "/stok-kangri-trek-guide",
  "/best-trekking-operators-india", "/how-to-reach-chopta-from-delhi", "/treks",
]);

function isHallucinatedRootSlug(pathname: string): boolean {
  if (!/^\/[^/]+$/.test(pathname)) return false;              // single root segment only
  if (REAL_ROOT_ROUTES.has(pathname)) return false;           // real page
  if (REDIRECTED_ROOT_SLUGS.has(pathname)) return false;      // let next.config 301 it
  return (pathname.match(/-/g)?.length ?? 0) >= 2;            // content-shaped ⇒ hallucination
}

const ADMIN_PREFIXES = ["/admin"];
const ADMIN_PUBLIC_PATHS = ["/admin/sign-in"]; // exempt from admin auth check
const GUEST_ONLY_PREFIXES = ["/auth/sign-in", "/auth/sign-up"];

const DATACENTER_HOST = "datacenter.trekyatra.co.in";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Step 72 — datacenter.trekyatra.co.in subdomain rewrite ───────────────────
  // Serves structured trek-guide data (TrekProfile) for TrekSage/MCP + humans,
  // from app/datacenter/**, without exposing those paths on the main domains.
  const host = request.headers.get("host") ?? "";
  if (host === DATACENTER_HOST || host.startsWith(`${DATACENTER_HOST}:`)) {
    const url = request.nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/datacenter";
    } else {
      url.pathname = `/datacenter${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

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

  // ── SEO: 410 Gone for agent-hallucinated dead root-level URLs (see notes above) ──
  if (isHallucinatedRootSlug(pathname)) {
    return new NextResponse("Gone — this page does not exist.", {
      status: 410,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
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
  // Run on all page paths (the 410 catch-all + datacenter rewrite + auth all need site-wide coverage),
  // but never on API routes, Next internals, or any file with an extension (sitemaps, robots, llms.txt,
  // images, _next assets) — those must pass straight through.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
