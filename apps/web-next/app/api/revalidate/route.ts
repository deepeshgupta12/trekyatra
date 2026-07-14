import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// On-demand invalidation for the Master CMS cache-clear (single + bulk) and the
// publish/save flow. IMPORTANT: pages read CMS content through `fetchCMSPage`, whose
// response lives in Next's Data Cache tagged `cms:{slug}` / `cms:all`. `revalidatePath`
// alone only busts a route's rendered HTML — on re-render it would still read STALE
// cached CMS data until the 60s window. So we ALSO `revalidateTag` to bust the CMS
// fetch data, guaranteeing published edits show instantly.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.scope === "all") {
      revalidateTag("cms:all");        // bust every CMS fetch entry
      revalidatePath("/", "layout");   // bust every rendered route
      return NextResponse.json({ revalidated: true, scope: "all" });
    }

    const slugs: string[] = [];
    if (body.slug) slugs.push(body.slug);
    if (Array.isArray(body.slugs)) slugs.push(...body.slugs);

    if (slugs.length === 0) {
      return NextResponse.json(
        { error: "Provide 'slug', 'slugs', or scope='all'" },
        { status: 400 }
      );
    }

    for (const slug of slugs) {
      revalidateTag(`cms:${slug}`);    // bust this page's CMS fetch data (any route using it)
      revalidatePath(`/trek/${slug}`); // bust the trek page's rendered HTML
    }

    return NextResponse.json({ revalidated: true, slugs });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
