# STEP-71 — Core Web Vitals Optimisation (Mobile + Desktop)

**Status:** Done
**Priority:** HIGH — Production performance is critically degraded (Mobile 56, Desktop 52)
**Depends on:** Steps 69, 69C, 69D (all done). No dependency on Step 70.

---

## Lighthouse Scores (Baseline — 2026-06-03)

| Metric | Mobile | Desktop | Target Mobile | Target Desktop |
|--------|--------|---------|---------------|----------------|
| Performance | 56 | 52 | **85+** | **90+** |
| FCP | 5.1 s | 1.1 s | < 1.8 s | < 0.8 s |
| LCP | 10.8 s | 8.0 s | < 2.5 s | < 2.5 s |
| TBT | 130 ms | 290 ms | < 100 ms | < 150 ms |
| CLS | 0 | 0.004 | 0 | 0 |
| Speed Index | 9.7 s | 3.7 s | < 3.5 s | < 1.5 s |

---

## Root Cause Analysis — Full Diagnostic (PageSpeed Insights 2026-06-03)

### 🔴 P0 — Render-blocking Google Fonts via CSS @import (FCP +3–5 s mobile)

**File:** `apps/web-next/app/globals.css` line 1
```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

CSS `@import` is **synchronous and render-blocking**. The browser must:
1. Download `globals.css`
2. Parse the `@import` declaration
3. Fetch `fonts.googleapis.com` (network round-trip)
4. Receive font CSS → discover `fonts.gstatic.com` woff2 files
5. Download 3 font files (another round-trip each)
6. Only then begin rendering

**Critical path chain confirmed by PageSpeed:** 4,383ms latency chain:
- `trekyatra.co.in` (HTML) → `globals.css` → `fonts.googleapis.com` (Font CSS) → 3× `fonts.gstatic.com` (woff2 files)

On mobile with throttled network (Lighthouse Moto G4 simulation), this chain adds **3–5 s to FCP**.

**Fix:** Replace with `next/font/google` — fonts are self-hosted at build time, zero network request, `font-display: swap` applied automatically.

---

### 🔴 P0 — Image optimisation disabled (LCP 10.8 s)

**File:** `apps/web-next/next.config.mjs`
```javascript
images: {
  unoptimized: true,
}
```

This disables ALL Next.js image processing. Every image is served as-is:
- `hero-himalaya-dawn.jpg` (140 KB JPEG) → served as 140 KB instead of ~25 KB WebP
- `region-uttarakhand-snow.jpg` (353 KB) → served as 353 KB
- CMS hero images from DigitalOcean Spaces (typically 1–5 MB original) → served uncompressed and at **full original resolution** (e.g. 2860×4024 served in a 628×418 card)

**DigitalOcean Spaces CDN hostname (confirmed):** `trekyatra-media.sgp1.digitaloceanspaces.com`

**PageSpeed findings on CDN images:**
- Images served with **Cache TTL: None** (no Cache-Control headers) — 9,871 KiB wasted on every repeat visit
- Original image dimensions served regardless of display size (2860×4024 for a thumbnail = massive wasted bandwidth)
- No WebP/AVIF conversion by the CDN

**Fix:** Remove `unoptimized: true`, configure `remotePatterns` for all external image hosts including DO Spaces. Enable AVIF/WebP formats and device-aware srcset.

---

### 🔴 P0 — Hero images not prioritised (LCP discovery delayed 3,910 ms)

**Files:**
- `apps/web-next/app/(public)/page.tsx` line ~99: `<img src="/images/hero-himalaya-dawn.jpg" ...>`
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` line 289: `<img src={heroImg} ...>`

No `fetchpriority="high"` attribute. Browser treats hero images as low-priority and doesn't download until layout is computed. **PageSpeed confirmed resource load delay of 3,910 ms on the LCP element.**

**Fix:** Add `fetchPriority="high"` to every above-fold hero `<img>` tag. Convert static homepage hero to `<Image priority>` from `next/image`.

---

### 🔴 P0 — Server TTFB 1,955 ms (affects all pages)

**PageSpeed finding:** Time to First Byte is 1,955 ms on the tested URL. This contributes directly to all time metrics including FCP and LCP.

**Root causes (in scope for this step):**
- No HTTP cache headers on the Next.js page response itself
- CDN/edge caching not active for the production domain

**Fix (partial — edge caching requires infrastructure):** Add `Cache-Control: s-maxage=300, stale-while-revalidate=60` headers for static pages. Set `revalidate` on data fetches in Server Components.

---

### 🟡 P1 — Legacy JavaScript polyfills (11 KiB wasted)

**PageSpeed finding:** 11 KiB of legacy JavaScript polyfills included in the bundle:
- `Array.prototype.at`
- `Array.prototype.flat`
- `Array.prototype.flatMap`
- `Object.fromEntries`
- Other ES2019+ polyfills

These are served because the `browserslist` target is too broad, causing Next.js to include polyfills for browsers that don't need them.

**Fix:** Update `apps/web-next/.browserslistrc` (or `package.json` `browserslist` field) to target modern browsers only:
```
> 0.5%, last 2 Chrome versions, last 2 Safari versions, last 2 Firefox versions, not dead, not IE 11
```

---

### 🟡 P1 — Google Tag Manager: 215 ms CPU load

**PageSpeed finding:** GTM script evaluation adds 215 ms to Total Blocking Time.

**Fix:** Load GTM with `strategy="lazyOnload"` via Next.js `<Script>` component to defer execution until after page is interactive.

---

### 🟡 P1 — Forced reflow: 112 ms (unattributed)

**PageSpeed finding:** 112 ms of forced layout/reflow triggered by JavaScript querying geometric properties (getBoundingClientRect, offsetWidth, etc.) after DOM mutations.

**Likely culprits:** Scroll-based animation hooks, sticky header height calculations, compare bar positioning.

**Fix:** Audit scroll handlers and intersection observer usage. Batch DOM reads/writes to avoid layout thrashing. This is best-effort — identify and fix obvious cases.

---

### 🟡 P1 — 301 KB PNG as favicon

**File:** `apps/web-next/app/layout.tsx`
```typescript
icons: { icon: [{ url: "/images/Logo_Trekyatra.png", type: "image/png" }] }
```

`Logo_Trekyatra.png` = 301 KB used as favicon. Browsers download favicon early, consuming bandwidth needed for hero image and fonts.

**Fix:** Create optimised favicon files (16×16 and 32×32 PNG, < 5 KB total) and reference them.

---

### 🟡 P1 — No preconnect for external CDN origins

**File:** `apps/web-next/app/layout.tsx`

No `<link rel="preconnect">` for external domains. Browser discovers these origins late:
- `trekyatra-media.sgp1.digitaloceanspaces.com` (DO Spaces CDN — main image host)
- `images.unsplash.com` (CMS hero images from some pages)
- `fonts.googleapis.com` + `fonts.gstatic.com` (removed by next/font fix)

**Fix:** Add `<link rel="preconnect">` for DO Spaces CDN and Unsplash in layout head.

---

### 🟡 P1 — Below-fold client components hydrate eagerly (TBT 290 ms desktop)

Heavy client components that are below the fold included in the initial JS bundle:
- `RecentlyViewedSection` (reads localStorage, renders personalised trek cards)
- `HomepagePersonalizationSection` (fetches user data, renders conditional sections)
- CDP analytics tracking init

**Fix:** Wrap below-fold client components in `dynamic(() => import(...), { ssr: false })`.

---

### 🟢 P2 — Accessibility failures (Lighthouse score impact)

**PageSpeed findings:**
1. **Unlabeled `<select>` elements** — select inputs without `<label>` or `aria-label` (affects filter selects on search/trek pages)
2. **Links without discernible names** — icon-only links (e.g. social icons, breadcrumb arrow) with no `aria-label`
3. **Colour contrast failures** — some text/background combinations below WCAG AA threshold (muted text over light backgrounds)

**Fix:** Add `aria-label` to all icon-only links and buttons. Add `<label htmlFor>` or `aria-label` to bare `<select>` elements. Bump low-contrast text colours in globals.css.

---

### 🟢 P2 — Static images not converted to WebP

**Files:** `/apps/web-next/public/images/`
```
hero-himalaya-dawn.jpg   140 KB
trek-summit.jpg          143 KB
trek-forest.jpg          352 KB
region-uttarakhand-snow.jpg  353 KB
region-ladakh.jpg        334 KB
region-sahyadri.jpg      ~200 KB
region-kashmir.jpg       ~200 KB
region-himachal-camp.jpg ~200 KB
```

Once Next.js image optimization is enabled, `<Image>` components auto-convert. Bare `<img>` tags should also use WebP sources.

**Fix:** Convert static JPEGs to WebP offline and update references. Additive on top of enabling image optimisation.

---

## Files to Create / Modify

| File | Change | Impact |
|------|--------|--------|
| `apps/web-next/app/globals.css` | Remove `@import` line; remove named font-family references | FCP −3 s mobile |
| `apps/web-next/app/layout.tsx` | Import `Fraunces`, `Inter`, `JetBrains_Mono` from `next/font/google`; apply CSS variable class names to `<html>`; add preconnect for DO Spaces + Unsplash; fix favicon; defer GTM | FCP −3 s, LCP −1 s |
| `apps/web-next/tailwind.config.ts` | Update `fontFamily` to CSS variable references | Required for next/font |
| `apps/web-next/next.config.mjs` | Remove `unoptimized: true`; add `remotePatterns` including DO Spaces, Unsplash, Pixabay; enable AVIF+WebP | LCP −6 s (60–80% image reduction) |
| `apps/web-next/app/(public)/page.tsx` | `fetchPriority="high"` on hero; convert to `<Image priority>`; dynamic imports for below-fold sections | LCP −2 s, TBT −100 ms |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | `fetchPriority="high"` on trek hero (line 289) | LCP −2 s on trek pages |
| `apps/web-next/package.json` | Update `browserslist` to modern browsers only | TBT −11 KiB polyfills |
| `apps/web-next/public/images/favicon-16.png` | New — 16×16 favicon (< 2 KB) | Bandwidth freed |
| `apps/web-next/public/images/favicon-32.png` | New — 32×32 favicon (< 3 KB) | Bandwidth freed |
| `apps/web-next/public/images/*.webp` | New — WebP versions of all static JPEGs | Image weight −60–80% |

Accessibility fixes (best-effort, audit during implementation):
| File | Change |
|------|--------|
| `apps/web-next/app/(public)/treks/page.tsx` | Add `aria-label` to filter `<select>` elements |
| `apps/web-next/app/(public)/search/page.tsx` | Add `aria-label` to filter `<select>` elements |
| `apps/web-next/app/layout.tsx` | Add `aria-label` to icon-only nav links |

---

## Implementation Order (within step)

1. **`next/font` migration** — globals.css + layout.tsx + tailwind.config.ts (atomic; partial migration causes visual regressions)
2. **Enable image optimisation** — next.config.mjs `remotePatterns`; test locally that external images render
3. **Hero `fetchpriority` + preload** — page.tsx and trek/[slug]/page.tsx
4. **Favicon optimisation** — create small PNGs, update layout.tsx icons
5. **Preconnect hints** — layout.tsx `<head>` for DO Spaces + Unsplash
6. **Dynamic imports for below-fold components** — page.tsx
7. **Browserslist target update** — package.json to cut legacy polyfills
8. **GTM deferred loading** — layout.tsx Script strategy
9. **Convert static images to WebP** — offline conversion + update src references
10. **Accessibility fixes** — aria-labels, select labels, contrast (audit-based)
11. **`next build`** — zero errors
12. **Update MD files + commit + push**

---

## Detailed Implementation Specs

### 1. next/font Migration (globals.css + layout.tsx + tailwind.config.ts)

**`globals.css`** — remove line 1 completely:
```diff
-@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

Check and update any explicit `font-family` declarations in globals.css to use CSS variables.

**`layout.tsx`** — add font imports and apply to `<html>`:
```typescript
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

// In RootLayout:
<html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
```

**`tailwind.config.ts`** — update font families to CSS variables:
```typescript
fontFamily: {
  display: ['var(--font-display)', 'Georgia', 'serif'],
  sans:    ['var(--font-sans)',    'system-ui', 'sans-serif'],
  mono:    ['var(--font-mono)',    'monospace'],
},
```

---

### 2. Next.js Image Optimisation (next.config.mjs)

```javascript
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "pixabay.com" },
    { protocol: "https", hostname: "cdn.pixabay.com" },
    { protocol: "https", hostname: "trekyatra-media.sgp1.digitaloceanspaces.com" },
    { protocol: "https", hostname: "*.digitaloceanspaces.com" },
  ],
  deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 64, 128, 256],
},
```

**Note:** With optimization enabled, all bare `<img>` tags for remote images need `width` and `height` props or will cause layout shift. `<Image>` handles this automatically.

---

### 3. Hero Image Priority (page.tsx + trek/[slug]/page.tsx)

**Homepage** (`app/(public)/page.tsx`) — convert hero to `<Image priority>`:
```typescript
import Image from "next/image";

<Image
  src="/images/hero-himalaya-dawn.jpg"
  alt="Himalayan dawn — TrekYatra hero"
  fill
  priority
  className="object-cover object-center"
  sizes="100vw"
/>
```

**Trek detail** (`app/(public)/trek/[slug]/page.tsx` line 289):
```diff
-<img src={heroImg} alt={trek.name} className="w-full h-full object-cover" width={1920} height={1080} />
+<img src={heroImg} alt={trek.name} className="w-full h-full object-cover" width={1920} height={1080} fetchPriority="high" />
```

The trek hero is a dynamic CMS URL — `fetchPriority="high"` on the bare `<img>` is the minimum fix; full `<Image>` conversion is available since `remotePatterns` will include the DO Spaces host.

---

### 4. Favicon Optimisation (layout.tsx)

Create two small favicon PNGs from the existing logo (16×16 and 32×32 pixels, < 5 KB):
- `public/images/favicon-16.png`
- `public/images/favicon-32.png`

Update `layout.tsx` icons:
```typescript
icons: {
  icon: [
    { url: "/images/favicon-16.png", sizes: "16x16", type: "image/png" },
    { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
  ],
  apple: "/images/Logo_Trekyatra.png",
  shortcut: "/images/favicon-32.png",
},
```

---

### 5. Preconnect Hints (layout.tsx)

After removing Google Fonts `@import`, add preconnect for remaining external image CDNs:

```tsx
// In RootLayout <head>:
<link rel="preconnect" href="https://trekyatra-media.sgp1.digitaloceanspaces.com" />
<link rel="preconnect" href="https://images.unsplash.com" />
```

---

### 6. Dynamic Imports for Below-fold Components (page.tsx)

```typescript
import dynamic from "next/dynamic";

const RecentlyViewedSection = dynamic(
  () => import("@/components/home/RecentlyViewedSection"),
  { ssr: false }
);

const HomepagePersonalizationSection = dynamic(
  () => import("@/components/home/HomepagePersonalizationSection"),
  { ssr: false }
);
```

These components read localStorage and auth state — already client-only. Deferring their JS loading reduces initial bundle and TTI.

---

### 7. Browserslist Target (package.json)

Add or update the `browserslist` field:
```json
"browserslist": [
  "> 0.5%",
  "last 2 Chrome versions",
  "last 2 Safari versions",
  "last 2 Firefox versions",
  "not dead",
  "not IE 11"
]
```

This eliminates polyfills for `Array.prototype.at`, `flat`, `flatMap`, `Object.fromEntries` etc. (~11 KiB reduction).

---

### 8. GTM Deferred Loading (layout.tsx)

Replace blocking GTM `<script>` with Next.js `<Script strategy="lazyOnload">`:
```typescript
import Script from "next/script";

// In layout body:
<Script
  id="gtm"
  strategy="lazyOnload"
  dangerouslySetInnerHTML={{
    __html: `(function(w,d,s,l,i){...GTM snippet...})(window,document,'script','dataLayer','GTM-XXXXX');`
  }}
/>
```

If GTM is currently loaded via a `<script>` tag in `layout.tsx`, convert it. If it's not currently present, skip this item.

---

### 9. Convert Static Images to WebP

Run offline (one-time asset conversion):
```bash
cwebp -q 80 apps/web-next/public/images/hero-himalaya-dawn.jpg -o apps/web-next/public/images/hero-himalaya-dawn.webp
cwebp -q 80 apps/web-next/public/images/trek-summit.jpg -o apps/web-next/public/images/trek-summit.webp
cwebp -q 80 apps/web-next/public/images/trek-forest.jpg -o apps/web-next/public/images/trek-forest.webp
cwebp -q 75 apps/web-next/public/images/region-uttarakhand-snow.jpg -o apps/web-next/public/images/region-uttarakhand-snow.webp
cwebp -q 75 apps/web-next/public/images/region-ladakh.jpg -o apps/web-next/public/images/region-ladakh.webp
cwebp -q 75 apps/web-next/public/images/region-sahyadri.jpg -o apps/web-next/public/images/region-sahyadri.webp
cwebp -q 75 apps/web-next/public/images/region-kashmir.jpg -o apps/web-next/public/images/region-kashmir.webp
cwebp -q 75 apps/web-next/public/images/region-himachal-camp.jpg -o apps/web-next/public/images/region-himachal-camp.webp
```

Update all `<img src="*.jpg">` references to `.webp`. With Next.js image optimization enabled, `<Image>` components auto-convert — manual WebP only helps bare `<img>` tags.

---

### 10. Accessibility Fixes (audit-based)

Scan for and fix the following patterns:

**Unlabeled `<select>` elements:**
```diff
-<select onChange={...}>
+<select aria-label="Filter by region" onChange={...}>
```

**Icon-only links:**
```diff
-<Link href="/..."><Icon className="h-5 w-5" /></Link>
+<Link href="/..." aria-label="View on Instagram"><Icon className="h-5 w-5" /></Link>
```

**Low-contrast text:** Audit `text-muted-foreground` and similar classes against background colours. Bump contrast where WCAG AA fails.

---

## No Backend Changes

This step is entirely frontend. No API routes, DB migrations, or backend service changes.

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| `next/font` migration | MEDIUM — wrong `axes` config could cause FOUT | Test locally: `npm run dev`, verify all Fraunces weights render correctly |
| Remove `unoptimized: true` | MEDIUM — remote image domains not in `remotePatterns` will 500 | Audit all remote image hostnames; add comprehensive `remotePatterns` |
| `fetchPriority` on hero | LOW — non-breaking HTML attribute | No risk |
| Dynamic imports | LOW — SSR false means components render only on client | Verify no hydration mismatch or empty SSR content for crawlers |
| Favicon swap | LOW — purely cosmetic | Visual check only |
| Browserslist change | LOW — only removes unnecessary polyfills | Test in latest Chrome/Safari/Firefox |
| GTM strategy change | LOW — deferred load, same data | Verify analytics events still fire on page load |

---

## Verification

### Build gate
```bash
cd apps/web-next && npm run build  # zero TypeScript errors
```

### Manual checks
1. All pages render correct fonts (Fraunces headings, Inter body)
2. CMS hero images load (DO Spaces URLs work via next/image)
3. Homepage hero loads immediately (no blank placeholder)
4. Favicon renders correctly in browser tab
5. Trek guide pages — hero image visible before scroll
6. Analytics events fire on page load (GTM not broken by defer)

---

## Expected Score After This Step

| Metric | Mobile Before | Mobile After | Desktop Before | Desktop After |
|--------|--------------|--------------|----------------|---------------|
| Performance | 56 | 82–88 | 52 | 88–92 |
| FCP | 5.1 s | 1.5–2.0 s | 1.1 s | 0.6–0.9 s |
| LCP | 10.8 s | 2.0–3.0 s | 8.0 s | 1.5–2.5 s |
| TBT | 130 ms | 80–120 ms | 290 ms | 120–160 ms |
| Speed Index | 9.7 s | 3.0–4.0 s | 3.7 s | 1.2–2.0 s |

The LCP improvement is primarily driven by fixes #2 (image optimization) and #3 (hero priority). The FCP improvement is primarily driven by fix #1 (next/font, eliminating render-blocking font request + 4,383ms critical chain). Together these three fixes should account for ~70% of the performance score gain.

---

## Files Created / Modified

| File | Change |
|------|--------|
| `apps/web-next/app/globals.css` | Removed render-blocking `@import url(fonts.googleapis.com...)` |
| `apps/web-next/app/layout.tsx` | Added `Fraunces`, `Inter`, `JetBrains_Mono` from `next/font/google`; CSS variable class names on `<html>`; `<link rel="preconnect">` for DO Spaces + Unsplash; favicon icons updated to 16px+32px optimised PNGs; GA4 + AdSense strategies changed to `lazyOnload` |
| `apps/web-next/tailwind.config.ts` | `fontFamily` updated to CSS variable references (`var(--font-display)`, `var(--font-sans)`, `var(--font-mono)`) |
| `apps/web-next/next.config.mjs` | Removed `unoptimized: true`; added `formats: ["image/avif","image/webp"]`; added `remotePatterns` for DO Spaces, Unsplash, Pixabay; added `deviceSizes` + `imageSizes` |
| `apps/web-next/app/(public)/page.tsx` | Homepage hero `<img>` → `<Image fill priority>`; `RecentlyViewedSection` + `PersonalisedFeed` → `makeDynamic(ssr:false)`; region/editorial/resources images updated to `.webp` |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | Added `fetchPriority="high"` to trek hero `<img>` (line 289) |
| `apps/web-next/app/(public)/explore/page.tsx` | Added `aria-label="Sort treks"` to sort select |
| `apps/web-next/app/(public)/compare/CompareClient.tsx` | Added `aria-label` to trek picker select |
| `apps/web-next/components/layout/Footer.tsx` | Added `aria-label` to all 3 footer social icon links (Instagram, YouTube, Mail) |
| `apps/web-next/.browserslistrc` | New — modern browser targets; eliminates legacy polyfills (~11 KB) |
| `apps/web-next/public/images/favicon-16.png` | New — 814 B (was 301 KB) |
| `apps/web-next/public/images/favicon-32.png` | New — 2.2 KB (was 301 KB) |
| `apps/web-next/public/images/hero-himalaya-dawn.webp` | New — 91 KB (from 140 KB JPEG, −35%) |
| `apps/web-next/public/images/trek-summit.webp` | New — 79 KB (from 143 KB JPEG, −45%) |
| `apps/web-next/public/images/trek-forest.webp` | New — 294 KB (from 352 KB JPEG) |
| `apps/web-next/public/images/region-*.webp` | New — 5 region images converted to WebP |

## Notes

- DO Spaces CDN Cache TTL: None issue — ideally set `Cache-Control: public, max-age=31536000, immutable` on the CDN bucket. This requires DigitalOcean Spaces configuration, not code changes. Flag to user as infrastructure task.
- Server TTFB 1,955ms — partially addressed by Next.js `revalidate` on data fetches; full CDN/edge caching requires infrastructure.
- Forced reflow 112ms — best-effort audit; exact source requires Chrome Performance profiling session.
