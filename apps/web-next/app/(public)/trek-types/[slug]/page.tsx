import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mountain, ArrowLeft, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCMSPage, fetchCMSPages } from "@/lib/api";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildBreadcrumbSchema } from "@/lib/schema";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion from "@/components/content/FAQAccordion";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  try {
    const page = await fetchCMSPage(`trek-types/${params.slug}`);
    return {
      title: page.seo_title ?? `${page.title} | TrekYatra`,
      description: page.seo_description ?? `Discover the best ${params.slug.replace(/-/g, " ")} treks in India.`,
      alternates: { canonical: `${siteUrl}/trek-types/${params.slug}` },
      openGraph: { title: page.title, images: page.hero_image_url ? [page.hero_image_url] : [] },
    };
  } catch {
    const label = params.slug.replace(/-/g, " ");
    return {
      title: `${label} Treks in India | TrekYatra`,
      description: `Explore the best ${label} trekking routes in India with TrekYatra.`,
    };
  }
}

export const revalidate = 3600;

export default async function TrekTypePage({ params }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const label = params.slug.replace(/-/g, " ");

  let page = null;
  try {
    page = await fetchCMSPage(`trek-types/${params.slug}`);
  } catch {
    // falls through to static template
  }

  const breadcrumbItems = [
    { label: "Home", href: `${siteUrl}/` },
    { label: "Trek Types", href: `${siteUrl}/explore` },
    { label: label.charAt(0).toUpperCase() + label.slice(1), href: `${siteUrl}/trek-types/${params.slug}` },
  ];

  const faqs = page?.content_json?.faqs ?? [];

  return (
    <>
      <SchemaInjector schemas={[buildBreadcrumbSchema(breadcrumbItems)]} />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden bg-gradient-to-br from-pine/20 via-[#0c0e14] to-accent/10">
        {page?.hero_image_url && (
          <div className="absolute inset-0">
            <img src={page.hero_image_url} alt={label} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 to-transparent" />
          </div>
        )}
        <div className="container-wide relative pb-12 pt-24">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-accent text-sm mb-5 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> All treks
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pine/10 border border-pine/20 text-pine text-xs uppercase tracking-widest mb-4">
            <Mountain className="h-3 w-3" /> Trek Category
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white leading-tight mb-4 capitalize">
            {page?.title ?? `${label} Treks`}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            {page?.seo_description ?? `Explore the best ${label} trekking routes in India, from beginner-friendly trails to advanced high-altitude adventures.`}
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-white/8 bg-[#0f1117]/60 py-3">
        <div className="container-wide">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: "Trek Types", href: "/explore" },
            { label: label.charAt(0).toUpperCase() + label.slice(1) },
          ]} />
        </div>
      </div>

      {/* Main content */}
      <section className="py-16">
        <div className="container-wide max-w-4xl">
          {page?.content_html ? (
            <div
              className="cms-section prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content_html }}
            />
          ) : (
            /* Static fallback when no CMS page exists */
            <div className="space-y-8">
              <div className="bg-[#14161f] rounded-2xl border border-white/10 p-6">
                <h2 className="font-display text-2xl font-semibold text-white mb-3 capitalize">
                  About {label} Treks
                </h2>
                <p className="text-white/70">
                  {label.charAt(0).toUpperCase() + label.slice(1)} treks in India offer a unique blend of adventure and natural beauty. These routes are curated for trekkers who want an authentic Himalayan experience without extreme technical demands.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Clock, label: "Duration", value: "3–7 days typical" },
                  { icon: Mountain, label: "Max Altitude", value: "3,500–5,000 m" },
                  { icon: ChevronRight, label: "Best Season", value: "May–Jun & Sep–Nov" },
                ].map(({ icon: Icon, label: l, value }) => (
                  <div key={l} className="bg-[#14161f] rounded-xl border border-white/10 p-4 text-center">
                    <Icon className="h-5 w-5 text-accent mx-auto mb-2" />
                    <p className="text-white/40 text-xs mb-1">{l}</p>
                    <p className="text-white font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ section */}
      {faqs.length > 0 && (
        <section className="py-12 border-t border-white/8">
          <div className="container-wide max-w-4xl">
            <h2 className="font-display text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
            <FAQAccordion items={faqs} />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-[#0f1117] border-t border-white/8">
        <div className="container-wide text-center">
          <h2 className="font-display text-3xl font-semibold text-white mb-3">Ready to plan your trek?</h2>
          <p className="text-white/60 mb-6">Get matched with the right trail based on your fitness and dates.</p>
          <Button variant="hero" size="lg" asChild>
            <Link href="/explore">Browse all treks</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
