import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.scope === "all") {
      revalidatePath("/", "layout");
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
      revalidatePath(`/trek/${slug}`);
    }

    return NextResponse.json({ revalidated: true, slugs });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
