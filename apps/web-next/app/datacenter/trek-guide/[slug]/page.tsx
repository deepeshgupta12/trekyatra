// Step 73: permanent 308 redirect to the ?slug= JSON viewer at /datacenter.
// All existing bookmarks to /trek-guide/[slug] keep working via the redirect.
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false } };

export default function TrekGuideDataPage({ params }: { params: { slug: string } }) {
  permanentRedirect(`/datacenter?slug=${params.slug}`);
}
