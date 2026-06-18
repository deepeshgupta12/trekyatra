"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mountain, MapPin, Clock, TrendingUp, ArrowUpRight, Calendar,
  IndianRupee, Users, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import type { TrekCard } from "./TreksageChat";
import type { TrekProfile } from "@/lib/api";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthList(nums: number[] | null | undefined): string {
  if (!nums || nums.length === 0) return "—";
  return nums.map(n => MONTH_NAMES[n] ?? "").filter(Boolean).join(", ");
}

const SECTION_LABELS: Record<string, string> = {
  overview:   "Overview",
  itinerary:  "Itinerary",
  packing:    "What to Pack",
  permits:    "Permits & Docs",
  costs:      "Costs & Budget",
  safety:     "Safety & AMS",
  transport:  "Getting There",
  camping:    "Camping & Stay",
  training:   "Fitness Training",
  best_time:  "Best Time to Go",
};

function SectionAccordion({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#1D3A2E]/8 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-xs font-semibold text-[#1D3A2E]/70">{label}</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-[#1D3A2E]/35 flex-shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-[#1D3A2E]/35 flex-shrink-0" />}
      </button>
      {open && (
        <p className="text-xs text-[#1D3A2E]/65 leading-relaxed pb-3 whitespace-pre-line">{content}</p>
      )}
    </div>
  );
}

interface Props {
  card: TrekCard;
  profile: TrekProfile | null;
  onClose?: () => void;
}

export default function TrekDetailPanel({ card, profile }: Props) {
  const [imgError, setImgError] = useState(false);

  // Use profile data if available, fall back to card
  const heroImage  = profile?.hero_image_url ?? card.hero_image_url;
  const difficulty = profile?.difficulty     ?? card.difficulty;
  const duration   = profile?.duration       ?? card.duration;
  const season     = profile?.season         ?? card.season;
  const state      = profile?.state          ?? card.state;
  const altFt      = profile?.max_altitude_ft ?? card.max_altitude_ft;
  const budMin     = profile?.budget_min     ?? card.budget_min;
  const budMax     = profile?.budget_max     ?? card.budget_max;

  const budgetText = budMin && budMax
    ? `₹${budMin.toLocaleString()} – ₹${budMax.toLocaleString()}`
    : budMin ? `From ₹${budMin.toLocaleString()}`
    : budMax ? `Up to ₹${budMax.toLocaleString()}`
    : null;

  const sectionEntries = Object.entries(profile?.content_sections ?? {}).filter(
    ([, v]) => v && v.trim().length > 0
  );

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-[#1D3A2E]/10 shadow-sm"
      style={{ animation: "tsSlideUp 0.3s ease-out" }}
    >
      {/* Hero */}
      <div className="relative h-52 bg-[#FAF5EE]">
        {heroImage && !imgError ? (
          <Image
            src={heroImage}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 60vw, 600px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Mountain className="h-12 w-12 text-[#1D3A2E]/15" />
            <p className="text-[#1D3A2E]/25 text-xs">No image available</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1D3A2E]/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display font-bold text-white text-lg leading-tight">{profile?.name ?? card.name}</h3>
          {state && (
            <p className="flex items-center gap-1 text-white/65 text-xs mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" /> {state}, India
            </p>
          )}
        </div>
      </div>

      <div className="p-4 max-h-[calc(100vh-24rem)] overflow-y-auto">

        {/* SEO description */}
        {profile?.seo_description && (
          <p className="text-[#1D3A2E]/60 text-xs leading-relaxed mb-4">{profile.seo_description}</p>
        )}

        {/* Key facts grid */}
        <h4 className="text-[10px] font-semibold text-[#1D3A2E]/40 uppercase tracking-wider mb-2.5">Trek Facts</h4>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: <Clock className="h-3.5 w-3.5 text-[#E8702A]" />,       label: "Duration",     value: duration ?? "—" },
            { icon: <TrendingUp className="h-3.5 w-3.5 text-[#E8702A]" />, label: "Difficulty",   value: difficulty ?? "—" },
            { icon: <Mountain className="h-3.5 w-3.5 text-[#E8702A]" />,   label: "Max Altitude", value: altFt ? `${altFt.toLocaleString()} ft` : "—" },
            { icon: <Calendar className="h-3.5 w-3.5 text-[#E8702A]" />,   label: "Best Season",  value: season ?? "—" },
            { icon: <MapPin className="h-3.5 w-3.5 text-[#E8702A]" />,     label: "State",        value: state ? `${state}, India` : "—" },
            ...(budgetText ? [{ icon: <IndianRupee className="h-3.5 w-3.5 text-[#E8702A]" />, label: "Budget", value: budgetText }] : []),
            ...(profile?.crowd_level ? [{ icon: <Users className="h-3.5 w-3.5 text-[#E8702A]" />, label: "Crowd Level", value: profile.crowd_level }] : []),
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-2 bg-[#FAF5EE] rounded-xl p-2.5">
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="min-w-0">
                <p className="text-[#1D3A2E]/40 text-[9px] font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-[#1D3A2E] text-xs font-semibold leading-tight mt-0.5 capitalize">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Month info */}
        {profile && (profile.best_months?.length || profile.open_months?.length || profile.avoid_months?.length) ? (
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold text-[#1D3A2E]/40 uppercase tracking-wider mb-2.5">Month Guide</h4>
            <div className="space-y-1.5">
              {profile.best_months?.length ? (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-[#1D3A2E]/50 text-[11px]">Best months:</span>
                  <span className="text-[#1D3A2E] font-medium text-[11px]">{monthList(profile.best_months)}</span>
                </div>
              ) : null}
              {profile.open_months?.length ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-3.5 w-3.5 flex-shrink-0 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1D3A2E]/30" />
                  </span>
                  <span className="text-[#1D3A2E]/50 text-[11px]">Open months:</span>
                  <span className="text-[#1D3A2E]/70 text-[11px]">{monthList(profile.open_months)}</span>
                </div>
              ) : null}
              {profile.avoid_months?.length ? (
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-[#1D3A2E]/50 text-[11px]">Avoid:</span>
                  <span className="text-amber-600 font-medium text-[11px]">{monthList(profile.avoid_months)}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Permit */}
        {profile?.permit_required !== null && profile?.permit_required !== undefined && (
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold text-[#1D3A2E]/40 uppercase tracking-wider mb-2">Permit</h4>
            <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${
              profile.permit_required
                ? "bg-amber-50 border border-amber-200/60"
                : "bg-emerald-50 border border-emerald-200/60"
            }`}>
              {profile.permit_required
                ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />}
              <div>
                <p className={`font-semibold ${profile.permit_required ? "text-amber-700" : "text-emerald-700"}`}>
                  {profile.permit_required ? "Permit required" : "No permit required"}
                </p>
                {profile.permit_notes && (
                  <p className="text-[#1D3A2E]/55 mt-0.5 leading-snug">{profile.permit_notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Themes */}
        {profile?.themes && profile.themes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold text-[#1D3A2E]/40 uppercase tracking-wider mb-2">Trek Type</h4>
            <div className="flex flex-wrap gap-1.5">
              {profile.themes.map(t => (
                <span key={t} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#1D3A2E]/8 text-[#1D3A2E]/65 capitalize">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suitability badges */}
        {profile && (profile.beginner_friendly || profile.solo_friendly || profile.family_friendly) && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {profile.beginner_friendly && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                <CheckCircle2 className="h-3 w-3" /> Beginner-friendly
              </span>
            )}
            {profile.solo_friendly && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50">
                <CheckCircle2 className="h-3 w-3" /> Solo-friendly
              </span>
            )}
            {profile.family_friendly && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/50">
                <CheckCircle2 className="h-3 w-3" /> Family-friendly
              </span>
            )}
          </div>
        )}

        {/* Content sections accordion */}
        {sectionEntries.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold text-[#1D3A2E]/40 uppercase tracking-wider mb-1">Guide Sections</h4>
            <div className="bg-[#FAF5EE] rounded-xl px-3">
              {sectionEntries.map(([key, content]) => (
                <SectionAccordion
                  key={key}
                  label={SECTION_LABELS[key] ?? key.replace(/_/g, " ")}
                  content={content}
                />
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {profile?.faqs && profile.faqs.length > 0 && (
          <div className="mb-5">
            <h4 className="text-[10px] font-semibold text-[#1D3A2E]/40 uppercase tracking-wider mb-1">FAQs</h4>
            <div className="bg-[#FAF5EE] rounded-xl px-3">
              {profile.faqs.map((faq, i) => (
                <SectionAccordion key={i} label={faq.question} content={faq.answer} />
              ))}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/trek/${card.slug}?ref=treksage`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E8702A] text-white text-sm font-semibold hover:bg-[#d4621f] transition-colors shadow-sm"
          >
            View Full Trek Page <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/plan?q=${encodeURIComponent(profile?.name ?? card.name)}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1D3A2E]/20 text-[#1D3A2E] text-sm font-semibold hover:bg-[#1D3A2E]/5 transition-colors"
          >
            Plan This Trek
          </Link>
        </div>
      </div>
    </div>
  );
}
