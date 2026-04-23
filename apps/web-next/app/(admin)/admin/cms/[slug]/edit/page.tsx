import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CMSPageForm from "@/components/admin/CMSPageForm";
import { fetchCMSPage } from "@/lib/api";

export default async function EditCMSPagePage({ params }: { params: { slug: string } }) {
  let page;
  try {
    page = await fetchCMSPage(params.slug);
  } catch {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-white/40 mb-6">
        <Link href="/admin/cms" className="hover:text-white transition-colors">Master CMS</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white/70 font-mono">{page.slug}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Edit page</h1>
          <p className="text-white/50 text-sm">{page.title}</p>
        </div>
        <a
          href={`/trek/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline w-fit"
        >
          View live page →
        </a>
      </div>

      <CMSPageForm mode="edit" existing={page} />
    </div>
  );
}
