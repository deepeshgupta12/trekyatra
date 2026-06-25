import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchTrekkerProfile } from "@/lib/buddies";
import { Mountain, Calendar, Award } from "lucide-react";

interface Props {
  params: { signalId: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const profile = await fetchTrekkerProfile(params.signalId);
    return {
      title: `${profile.display_name} — Trekker Profile`,
      description: profile.bio ?? `${profile.display_name} is planning a trek on TrekYatra.`,
    };
  } catch {
    return { title: "Trekker Profile" };
  }
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

export default async function TrekkerProfilePage({ params }: Props) {
  let profile;
  try {
    profile = await fetchTrekkerProfile(params.signalId);
  } catch {
    notFound();
  }

  const initials = profile.display_name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="container-wide py-12">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link
          href={`/trek/${profile.trek_slug}`}
          className="text-sm text-foreground/50 hover:text-accent transition-colors flex items-center gap-1 mb-8"
        >
          ← Back to {profile.trek_slug.replace(/-/g, " ")}
        </Link>

        {/* Profile card */}
        <div className="rounded-2xl border border-foreground/10 p-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xl font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-semibold">{profile.display_name}</h1>
              <p className="text-foreground/50 text-sm mt-0.5">
                Member since {profile.joined_year}
              </p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-foreground/70 text-sm leading-relaxed">{profile.bio}</p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Mountain className="h-4 w-4 text-accent" />
              <span className="text-foreground/60">{profile.trek_count} trek{profile.trek_count !== 1 ? "s" : ""} completed</span>
            </div>
            {profile.experience && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-accent" />
                <span className="text-foreground/60">{EXPERIENCE_LABELS[profile.experience] ?? profile.experience}</span>
              </div>
            )}
          </div>

          {/* Planning context */}
          <div className="rounded-xl border border-foreground/8 bg-foreground/2 px-4 py-3 space-y-1.5">
            <p className="text-xs font-medium text-foreground/40 uppercase tracking-wide">Planning signal</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link href={`/trek/${profile.trek_slug}`} className="font-semibold hover:text-accent transition-colors">
                {profile.trek_slug.replace(/-/g, " ")}
              </Link>
              <span className="flex items-center gap-1 text-foreground/50">
                <Calendar className="h-3.5 w-3.5" />
                {profile.month_year}
              </span>
            </div>
          </div>

          {/* Privacy notice */}
          <p className="text-xs text-foreground/30 leading-snug">
            This is a privacy-protected profile. Contact details are only shared via email after both parties accept a buddy request.
          </p>
        </div>
      </div>
    </main>
  );
}
