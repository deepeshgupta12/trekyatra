import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Globe, Phone, Star } from "lucide-react";
import { fetchPublicOperator, fetchOperatorReviews } from "@/lib/api";
import OperatorReviewList from "@/components/operators/OperatorReviewList";
import OperatorInquiryForm from "@/components/operators/OperatorInquiryForm";
import Breadcrumb from "@/components/content/Breadcrumb";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const op = await fetchPublicOperator(params.slug);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
    const title = `${op.name} — Trek Operator`;
    const description = op.description_long?.slice(0, 160) ?? `${op.name} is a vetted trekking operator on TrekYatra.`;
    const canonical = `${siteUrl}/operators/${op.slug}`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: "profile" },
    };
  } catch {
    return { title: "Operator" };
  }
}

export default async function OperatorDetailPage({ params }: { params: { slug: string } }) {
  let operator;
  let reviews = [];
  try {
    operator = await fetchPublicOperator(params.slug);
    reviews = await fetchOperatorReviews(params.slug);
  } catch {
    notFound();
  }

  const regions = operator.region ?? [];
  const trekTypes = operator.trek_types ?? [];

  return (
    <div className="container-wide py-10 max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Operators", href: "/operators" },
          { label: operator.name, href: `/operators/${operator.slug}` },
        ]}
      />

      {/* Header card */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-8">
        <div className="flex items-start gap-4">
          {operator.logo_url ? (
            <img src={operator.logo_url} alt={operator.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="text-accent font-bold text-2xl">{operator.name[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-1">{operator.name}</h1>
            {operator.review_count > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-medium text-foreground">{operator.rating_avg.toFixed(1)}</span>
                <span>({operator.review_count} {operator.review_count === 1 ? "review" : "reviews"})</span>
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {regions.length > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {regions.join(", ")}
                </span>
              )}
              {operator.website_url && (
                <a href={operator.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
              {operator.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {operator.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {trekTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {trekTypes.map((t) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                {t}
              </span>
            ))}
          </div>
        )}

        {operator.description_long && (
          <p className="mt-4 text-muted-foreground leading-relaxed">{operator.description_long}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Reviews */}
        <div className="lg:col-span-3">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Reviews ({operator.review_count})
          </h2>
          <OperatorReviewList reviews={reviews} />
        </div>

        {/* Inquiry form */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl border border-border p-5 sticky top-20">
            <h2 className="font-display text-lg font-semibold text-foreground mb-1">Send an inquiry</h2>
            <p className="text-sm text-muted-foreground mb-4">Free — no spam. Response within 48 hours.</p>
            <OperatorInquiryForm operatorSlug={operator.slug} operatorName={operator.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
