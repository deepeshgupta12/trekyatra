# STEP-71 — Core Web Vitals Optimisation (Mobile + Desktop)

**Status:** Pending
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

## Root Cause Analysis

### 🔴 P0 — Render-blocking Google Fonts (FCP +3–5 s on mobile)

**File:** `apps/web-next/app/globals.css` line 1
```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:...');
```

CSS `@import` is **synchronous and render-blocking**. The browser must:
1. Download `globals.css`
2. Parse the `@import` declaration
3. Fetch `fonts.googleapis.com` (network round-trip)
4. Receive font CSS → then discover `fonts.gstatic.com` font files
5. Download font files (another round-trip)
6. Only then begin rendering

On mobile with throttled network (Lighthouse Moto G4 simulation), this chain adds 3–5 s to FCP.

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
- CMS hero images from Unsplash (typically 1–5 MB original) → served uncompressed

With optimization enabled, Next.js serves:
- WebP or AVIF (60–80% size reduction)
- Correct `srcset` for each viewport
- Cached resized variants

**Fix:** Remove `unoptimized: true`, configure `remotePatterns` for external image hosts.

---

### 🔴 P0 — Hero images not prioritised (LCP discovery delayed)

**Files:**
- `apps/web-next/app/(public)/page.tsx` line 99: `<img src="/images/hero-himalaya-dawn.jpg" ...>`
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` line 289: `<img src={heroImg} ...>`

No `fetchpriority="high"` attribute and no `<link rel="preload" as="image">`. Browser treats hero images as low-priority and doesn't download them until layout is computed. This is the **direct cause of LCP > 8 s**.

**Fix:** Add `fetchPriority="high"` to every above-fold hero `<img>` tag. Add a `<link rel="preload">` hint in the document `<head>` for the static homepage hero.

---

### 🟡 P1 — 301 KB PNG as favicon

**File:** `apps/web-next/app/layout.tsx` line 18
```typescript
icons: { icon: [{ url: "/images/Logo_Trekyatra.png", type: "image/png" }] }
```

The logo PNG (`Logo_Trekyatra.png` = 301 KB) is used as favicon. Browsers download the favicon early, blocking network bandwidth needed for the hero image and fonts.

**Fix:** Create optimised favicon files (16×16 and 32×32 PNG, < 5 KB total) and reference them. Keep the full logo PNG only for Apple touch icon (192×192 max).

---

### 🟡 P1 — No preconnect for external origins

**File:** `apps/web-next/app/layout.tsx`

No `<link rel="preconnect">` for external domains. Browser discovers these origins late:
- `fonts.googleapis.com` + `fonts.gstatic.com` (removed by next/font fix)
- `images.unsplash.com` (CMS hero images)

**Fix:** Add `<link rel="preconnect" href="https://images.unsplash.com">` in layout head (post font migration, Google Fonts preconnect no longer needed).

---

### 🟡 P1 — Below-fold client components hydrate eagerly (TBT 290 ms desktop)

Heavy client components that are below the fold are included in the initial JS bundle and hydrated immediately:
- `RecentlyViewedSection` (reads localStorage, renders personalised trek cards)
- `HomepagePersonalizationSection` (fetches user data, renders conditional sections)
- Analytics CDP tracking init

These block the main thread during hydration, raising TBT.

**Fix:** Wrap below-fold client components in `dynamic(() => import(...), { ssr: false })` so their JS is split into a separate chunk and loaded after TTI.

---

### 🟢 P2 — Static images not converted to WebP

**Files:** `/apps/web-next/public/images/`
```
hero-himalaya-dawn.jpg   140 KB
trek-summit.jpg          143 KB
region-*.jpg             230–353 KB each
```

Once Next.js image optimization is enabled (P0 fix above), static images served via `<Image>` will be auto-converted. However, images served via bare `<img>` tags (non-LCP below-fold images) should also be converted.

**Fix:** Convert static JPEGs to WebP offline and update references. This is additive on top of enabling image optimisation.

---

## Files to Create / Modify

| File | Change | Impact |
|------|--------|--------|
| `apps/web-next/app/globals.css` | Remove `@import` line; replace font-family values with CSS variables | FCP −3 s mobile |
| `apps/web-next/app/layout.tsx` | Import `Fraunces`, `Inter`, `JetBrains_Mono` from `next/font/google`; apply variable class names to `<html>`; add `<link rel="preload">` for homepage hero; add preconnect for Unsplash; fix favicon to small optimised PNG | FCP −3 s, LCP −1 s |
| `apps/web-next/tailwind.config.ts` | Update `fontFamily` to use CSS variable references (`var(--font-display)`, `var(--font-sans)`, `var(--font-mono)`) | Required for next/font |
| `apps/web-next/next.config.mjs` | Remove `unoptimized: true`; add `remotePatterns` for `images.unsplash.com`, `pixabay.com`, `*.digitaloceanspaces.com` | LCP −6 s (60–80% image size reduction) |
| `apps/web-next/app/(public)/page.tsx` | Add `fetchPriority="high"` to homepage hero `<img>`; convert LCP element to `<Image priority>` from next/image | LCP −2 s |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | Add `fetchPriority="high"` to trek hero `<img>` (line 289); or convert to `<Image priority>` | LCP −2 s on trek pages |
| `apps/web-next/app/(public)/page.tsx` | Wrap `RecentlyViewedSection` and `HomepagePersonalizationSection` in `dynamic(...)` | TBT −100 ms desktop |
| `apps/web-next/public/images/` | Add `favicon-16.png` and `favicon-32.png` (< 5 KB each); keep Logo_Trekyatra.png for OG/Apple only | Network bandwidth freed |

---

## Implementation Order (within step)

1. **`next/font` migration** — globals.css + layout.tsx + tailwind.config.ts (do together atomically; partial migration causes visual regressions)
2. **Enable image optimisation** — next.config.mjs `remotePatterns`; test locally that external images render
3. **Hero `fetchpriority` + preload** — page.tsx and trek/[slug]/page.tsx
4. **Favicon optimisation** — create small PNGs, update layout.tsx icons
5. **Preconnect hints** — layout.tsx `<head>`
6. **Dynamic imports for below-fold components** — page.tsx
7. **Convert static images to WebP** — offline conversion + update src references
8. **`next build`** — zero errors
9. **Run Lighthouse** locally (simulated throttle) to verify improvement
10. **Update MD files + commit + push**

---

## Detailed Implementation Specs

### 1. next/font Migration (globals.css + layout.tsx + tailwind.config.ts)

**`globals.css`** — remove line 1:
```diff
-@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

Update font-family declarations to use CSS variables:
```diff
-  font-family: 'Inter', system-ui, sans-serif;
+  font-family: var(--font-sans), system-ui, sans-serif;
-  font-family: 'Fraunces', Georgia, serif;
+  font-family: var(--font-display), Georgia, serif;
```

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

**`tailwind.config.ts`** — update font families:
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
    { protocol: "https", hostname: "*.digitaloceanspaces.com" },
    // Add any other CMS image hosts discovered
  ],
  deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 64, 128, 256],
},
```

**Important:** With optimization enabled, all bare `<img>` tags for remote images need `width` and `height` props or they will cause layout shift. The `<Image>` component from `next/image` handles this automatically.

---

### 3. Hero Image Priority (page.tsx + trek/[slug]/page.tsx)

**Homepage** (`app/(public)/page.tsx`):
```diff
-<img src="/images/hero-himalaya-dawn.jpg" alt="..." className="...">
+<img src="/images/hero-himalaya-dawn.jpg" alt="..." className="..." fetchPriority="high">
```

Also add in `layout.tsx` `<head>` section (for homepage only — conditional):
Actually, a simpler approach is to use `next/image` with `priority` prop for the static hero. Convert the static homepage hero `<img>` to `<Image>` from `next/image`:

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

Note: The trek hero is a dynamic CMS URL — switching to `<Image>` requires the remote pattern to be registered. Use `fetchPriority="high"` on the bare `<img>` as the minimum fix; full `<Image>` conversion is the complete fix.

---

### 4. Favicon Optimisation (layout.tsx)

Create two small favicon PNGs from the existing logo (16×16 and 32×32 pixels, < 5 KB):
- `public/images/favicon-16.png`
- `public/images/favicon-32.png`

Update `layout.tsx`:
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

After removing Google Fonts `@import`, add preconnect for remaining external image CDN:

In `<head>` (via Next.js metadata or direct `<link>` in `layout.tsx`):
```typescript
// In RootLayout return:
<head>
  <link rel="preconnect" href="https://images.unsplash.com" />
</head>
```

Or via Next.js metadata API:
```typescript
export const metadata: Metadata = {
  ...
};
// Next.js doesn't support preconnect via metadata API directly;
// use <link> tags in the layout JSX head section.
```

---

### 6. Dynamic Imports for Below-fold Components (page.tsx)

**`apps/web-next/app/(public)/page.tsx`:**
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

These components read localStorage and auth state — they are already client-only (`"use client"`). Deferring their JS loading reduces the initial bundle and TTI.

**Note:** Check that the existing `RecentlyViewedSection` import in `page.tsx` is not also used above-the-fold before making it dynamic.

---

### 7. Convert Static Images to WebP

Run offline (not a code change — a one-time asset conversion):
```bash
# Requires imagemagick or cwebp CLI
cwebp -q 80 public/images/hero-himalaya-dawn.jpg -o public/images/hero-himalaya-dawn.webp
cwebp -q 80 public/images/trek-summit.jpg -o public/images/trek-summit.webp
cwebp -q 80 public/images/trek-forest.jpg -o public/images/trek-forest.webp
cwebp -q 75 public/images/region-uttarakhand-snow.jpg -o public/images/region-uttarakhand-snow.webp
cwebp -q 75 public/images/region-ladakh.jpg -o public/images/region-ladakh.webp
cwebp -q 75 public/images/region-sahyadri.jpg -o public/images/region-sahyadri.webp
cwebp -q 75 public/images/region-kashmir.jpg -o public/images/region-kashmir.webp
cwebp -q 75 public/images/region-himachal-camp.jpg -o public/images/region-himachal-camp.webp
```

Update all `<img src="*.jpg">` references that point to these files to use `.webp`. This is additive; even with image optimization enabled, serving WebP source files means the optimizer starts from a smaller base.

**Note:** With Next.js image optimization enabled (fix #2), `<Image>` components will auto-convert JPEG → WebP/AVIF. Manual WebP conversion only helps bare `<img>` tags that cannot use `<Image>`.

---

## No Backend Changes

This step is entirely frontend. No API routes, DB migrations, or backend service changes.

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| `next/font` migration | MEDIUM — wrong `axes` config could cause FOUT | Test locally: `npm run dev`, verify all Fraunces weights render correctly |
| Remove `unoptimized: true` | MEDIUM — remote image domains not in `remotePatterns` will error | Audit all remote image hostnames before removing; add comprehensive `remotePatterns` |
| `fetchPriority` on hero | LOW — non-breaking HTML attribute | No risk |
| Dynamic imports | LOW — SSR false means components render only on client | Verify no hydration mismatch or empty SSR content for crawlers |
| Favicon swap | LOW — purely cosmetic | Visual check only |

---

## Verification

### Build gate
```bash
cd apps/web-next && npm run build  # zero TypeScript errors
```

### Lighthouse (local)
```bash
cd apps/web-next && npm run build && npm run start
# Open Chrome → DevTools → Lighthouse → Mobile → Analyze
# Target: Performance > 80 on mobile simulation
```

### Manual checks
1. All pages render correct fonts (Fraunces headings, Inter body)
2. CMS hero images load (Unsplash URLs work via next/image)
3. Homepage hero loads immediately (no blank placeholder)
4. Favicon renders correctly in browser tab
5. Trek guide pages — hero image visible before scroll

---

## Expected Score After This Step

| Metric | Mobile Before | Mobile After | Desktop Before | Desktop After |
|--------|--------------|--------------|----------------|---------------|
| Performance | 56 | 82–88 | 52 | 88–92 |
| FCP | 5.1 s | 1.5–2.0 s | 1.1 s | 0.6–0.9 s |
| LCP | 10.8 s | 2.0–3.0 s | 8.0 s | 1.5–2.5 s |
| TBT | 130 ms | 80–120 ms | 290 ms | 120–160 ms |
| Speed Index | 9.7 s | 3.0–4.0 s | 3.7 s | 1.2–2.0 s |

The LCP improvement is primarily driven by fixes #2 (image optimization) and #3 (hero priority). The FCP improvement is primarily driven by fix #1 (next/font, eliminating render-blocking font request). Together these three fixes should account for ~70% of the performance score gain.
