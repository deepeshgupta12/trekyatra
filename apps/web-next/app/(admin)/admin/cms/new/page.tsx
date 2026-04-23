import CMSPageForm from "@/components/admin/CMSPageForm";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function NewCMSPagePage() {
  return (
    <div className="p-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-white/40 mb-6">
        <Link href="/admin/cms" className="hover:text-white transition-colors">Master CMS</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white/70">New page</span>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">New CMS page</h1>
        <p className="text-white/50 text-sm">Create a manually authored content page. Content sections map directly to the public page blocks.</p>
      </div>

      <CMSPageForm mode="create" />
    </div>
  );
}
