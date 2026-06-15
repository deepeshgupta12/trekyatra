import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchTrekProfile, type TrekProfile } from "@/lib/api";

export const revalidate = 1800;

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthsLabel(months: number[] | null | undefined): string {
  if (!months || months.length === 0) return "—";
  return months.map((m) => MONTH_NAMES[m] ?? String(m)).join(", ");
}

function boolLabel(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "Yes" : "No";
}

function moneyLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

const CONFIDENCE_STYLE: Record<string, string> = {
  verified: "text-pine bg-pine/10 border border-pine/20",
  draft: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  missing: "text-white/30 bg-white/5 border border-white/10",
};

function ConfidenceBadge({ field, confidence }: { field: string; confidence: Record<string, string> }) {
  const status = confidence[field];
  if (!status) return null;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-2 ${CONFIDENCE_STYLE[status] ?? CONFIDENCE_STYLE.missing}`}>
      {status}
    </span>
  );
}

function Row({ label, field, value, confidence }: { label: string; field: string; value: React.ReactNode; confidence: Record<string, string> }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 py-2 border-b border-white/8 text-sm">
      <div className="text-white/50 font-medium flex items-center">
        {label}
        <ConfidenceBadge field={field} confidence={confidence} />
      </div>
      <div className="text-white/85">{value}</div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const profile = await fetchTrekProfile(params.slug);
  if (!profile) return { title: "Trek not found" };
  return { title: profile.name };
}

export default async function TrekGuideDataPage({ params }: { params: { slug: string } }) {
  const profile: TrekProfile | null = await fetchTrekProfile(params.slug);
  if (!profile) notFound();

  const confidence = profile.data_confidence ?? {};

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">{profile.name}</h1>
      <p className="text-white/50 text-sm mb-6">
        slug: <code className="text-white/70">{profile.slug}</code>
        {profile.last_verified_at && (
          <> · last verified {new Date(profile.last_verified_at).toLocaleDateString("en-IN")}</>
        )}
      </p>

      {profile.is_unsafe_closed && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          This trek is currently marked unsafe / closed and is excluded from recommendations.
        </div>
      )}

      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
        <Row label="Title" field="title" value={profile.title} confidence={confidence} />
        <Row label="State" field="state" value={profile.state ?? "—"} confidence={confidence} />
        <Row label="Region" field="region" value={profile.region ?? "—"} confidence={confidence} />
        <Row label="Difficulty" field="difficulty" value={profile.difficulty ?? "—"} confidence={confidence} />
        <Row
          label="Duration"
          field="duration"
          value={profile.duration_days_min && profile.duration_days_max
            ? `${profile.duration} (${profile.duration_days_min}–${profile.duration_days_max} days)`
            : profile.duration ?? "—"}
          confidence={confidence}
        />
        <Row label="Best season" field="season" value={profile.season ?? "—"} confidence={confidence} />
        <Row label="Best months" field="best_months" value={monthsLabel(profile.best_months)} confidence={confidence} />
        <Row label="Open months" field="open_months" value={monthsLabel(profile.open_months)} confidence={confidence} />
        <Row label="Avoid months" field="avoid_months" value={monthsLabel(profile.avoid_months)} confidence={confidence} />
        <Row label="Max altitude" field="max_altitude_ft" value={profile.max_altitude_ft ? `${profile.max_altitude_ft.toLocaleString("en-IN")} ft` : "—"} confidence={confidence} />
        <Row label="Permit required" field="permit_required" value={boolLabel(profile.permit_required)} confidence={confidence} />
        <Row label="Permit notes" field="permit_notes" value={profile.permit_notes ?? "—"} confidence={confidence} />
        <Row label="Budget — from" field="budget_min" value={moneyLabel(profile.budget_min)} confidence={confidence} />
        <Row label="Budget — up to" field="budget_max" value={moneyLabel(profile.budget_max)} confidence={confidence} />
        <Row label="Themes" field="themes" value={profile.themes?.length ? profile.themes.join(", ") : "—"} confidence={confidence} />
        <Row label="Crowd level" field="crowd_level" value={profile.crowd_level ?? "—"} confidence={confidence} />
        <Row label="Beginner friendly" field="beginner_friendly" value={boolLabel(profile.beginner_friendly)} confidence={confidence} />
        <Row label="Solo friendly" field="solo_friendly" value={boolLabel(profile.solo_friendly)} confidence={confidence} />
        <Row label="Family friendly" field="family_friendly" value={boolLabel(profile.family_friendly)} confidence={confidence} />
        <Row label="Operator available" field="operator_available" value={boolLabel(profile.operator_available)} confidence={confidence} />
        <Row label="Suitability" field="suitability" value={profile.suitability ?? "—"} confidence={confidence} />
        <Row label="Description" field="seo_description" value={profile.seo_description ?? "—"} confidence={confidence} />
      </div>
    </div>
  );
}
