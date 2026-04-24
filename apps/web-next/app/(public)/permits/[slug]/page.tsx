import type { Metadata } from "next";
import { fetchCMSPage, type CMSPage, type FAQItem } from "@/lib/api";
import { fetchTreks } from "@/lib/trekApi";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion from "@/components/content/FAQAccordion";
import AuthorBlock from "@/components/content/AuthorBlock";
import SafetyDisclaimer from "@/components/content/SafetyDisclaimer";
import { FileCheck, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

export async function generateStaticParams() {
  const treks = await fetchTreks();
  return treks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* not found */ }
  const title = cmsPage?.seo_title ?? `Permit Guide — ${params.slug.replace(/-/g, " ")}`;
  const description = cmsPage?.seo_description ?? "Official permit requirements and how to obtain them.";
  return { title, description };
}

export default async function PermitPage({ params }: { params: { slug: string } }) {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* static fallback */ }

  const sec = (cmsPage?.content_json?.sections ?? {}) as Record<string, string>;
  const faqItems: FAQItem[] = cmsPage?.content_json?.faqs ?? [];
  const pageTitle = cmsPage?.title ?? `${params.slug.replace(/-/g, " ")} — Permit Guide`;

  return (
    <>
      <section className="bg-gradient-to-br from-background to-warning/5 border-b border-border py-14">
        <div className="container-wide max-w-3xl">
          <Breadcrumb items={[
            { label: "Permits", href: "/permits" },
            { label: pageTitle.split(":")[0] },
          ]} />
          <div className="flex items-center gap-3 mt-5 mb-4">
            <div className="h-10 w-10 rounded-xl bg-warning/15 flex items-center justify-center text-warning">
              <FileCheck className="h-5 w-5" />
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Permit guide</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">{pageTitle}</h1>
          {cmsPage?.seo_description && (
            <p className="text-lg text-muted-foreground">{cmsPage.seo_description}</p>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container-wide max-w-3xl space-y-10">
          <SafetyDisclaimer message="Permit requirements change. Always verify with the local forest department or official government portal before your trek." />

          {sec.permits ? (
            <div className="cms-section prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: sec.permits }} />
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 p-5 bg-warning/8 border border-warning/20 rounded-2xl">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p><strong>Forest Department permit required</strong> — obtain before entering the protected area.</p>
                  <p className="text-muted-foreground">Fees are subject to revision. Contact the local ranger station for current rates.</p>
                </div>
              </div>
              <div className="p-5 bg-card border border-border rounded-2xl flex items-start gap-3">
                <ExternalLink className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm">For official government portal links and district forest office contacts, <Link href="/contact" className="text-accent underline">contact our team</Link>.</p>
              </div>
            </div>
          )}

          {faqItems.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold mb-4">Permit FAQs</h2>
              <FAQAccordion items={faqItems} />
            </div>
          )}

          <AuthorBlock publishedAt={cmsPage?.published_at} updatedAt={cmsPage?.updated_at} />
        </div>
      </section>
    </>
  );
}
