"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecommendationCard from "@/components/plan/RecommendationCard";
import LeadCaptureModal, { type LeadData } from "@/components/plan/LeadCaptureModal";
import type { PlanRecommendResponse, TrekRecommendation } from "@/lib/api";

export default function PlanResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<PlanRecommendResponse | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showLead, setShowLead] = useState(false);
  const [enquireTrek, setEnquireTrek] = useState<TrekRecommendation | undefined>();

  useEffect(() => {
    const stored = sessionStorage.getItem("plan_results");
    if (!stored) {
      router.replace("/plan");
      return;
    }
    try {
      setResults(JSON.parse(stored));
      // Show lead capture after 8 seconds (gives user time to browse)
      const timer = setTimeout(() => setShowLead(true), 8000);
      return () => clearTimeout(timer);
    } catch {
      router.replace("/plan");
    }
  }, [router]);

  function toggleCompare(slug: string) {
    setCompareList(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug)
        : prev.length < 3 ? [...prev, slug] : prev
    );
  }

  async function handleLeadSubmit(data: LeadData) {
    await fetch("/api/v1/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        email: null,
        trek_slug: results?.recommendations[0]?.slug ?? null,
        source: "plan_my_trek",
        message: `City: ${data.city}, Month: ${data.travel_month}, Group size: ${data.group_size}`,
      }),
    });
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading your recommendations…</div>
      </div>
    );
  }

  const { recommendations, no_match, no_match_message, total_treks_scored } = results;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-12">
      <div className="container-wide max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push("/plan")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent mb-5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Adjust preferences
          </button>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            {no_match ? "Closest Matches Found" : "Your TrekYatra Plan is Ready"}
          </h1>
          <p className="text-muted-foreground">
            {no_match && no_match_message
              ? no_match_message
              : `Based on your season, fitness, budget, and travel style — scored from ${total_treks_scored} published trek guides.`}
          </p>
        </div>

        {/* Compare bar */}
        {compareList.length >= 2 && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium">{compareList.length} treks selected for comparison</span>
            <Link href={`/compare?slugs=${compareList.join(",")}`}>
              <Button variant="default" size="sm" className="gap-1.5">
                <GitCompare className="h-3.5 w-3.5" /> Compare now
              </Button>
            </Link>
          </div>
        )}

        {/* Recommendations grid */}
        {recommendations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map(rec => (
              <RecommendationCard
                key={rec.slug}
                rec={rec}
                onAddToCompare={toggleCompare}
                compareSelected={compareList.includes(rec.slug)}
                onEnquire={(r) => { setEnquireTrek(r); setShowLead(true); }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-5">No treks matched your criteria. Try widening your preferences.</p>
            <Link href="/plan"><Button variant="default">Try again</Button></Link>
          </div>
        )}

        {/* Bottom CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => setShowLead(true)} className="gap-2">
            📱 Get this plan on WhatsApp
          </Button>
          <Link href="/explore">
            <Button variant="outline" className="w-full sm:w-auto">Browse all treks</Button>
          </Link>
          {compareList.length >= 2 && (
            <Link href={`/compare?slugs=${compareList.join(",")}`}>
              <Button variant="hero" className="w-full sm:w-auto gap-1.5">
                <GitCompare className="h-4 w-4" /> Compare selected treks
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Lead capture modal */}
      {showLead && (
        <LeadCaptureModal
          topTrek={recommendations[0]}
          onClose={() => setShowLead(false)}
          onSubmit={handleLeadSubmit}
        />
      )}
    </div>
  );
}
