import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

export const metadata: Metadata = {
  title: "Authors & Editorial Team — TrekYatra",
  description: "Meet the editorial team behind TrekYatra — trekkers and engineers who research and verify India's most trusted trekking guides.",
  alternates: { canonical: `${SITE_URL}/about/authors` },
  authors: [{ name: "Deepesh Kumar Gupta", url: `${SITE_URL}/about/authors` }],
  creator: "TrekYatra",
  publisher: "TrekYatra",
};

const schema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Authors & Editorial Team — TrekYatra",
  description: "The editorial team behind TrekYatra's trekking guides.",
  url: `${SITE_URL}/about/authors`,
  publisher: { "@type": "Organization", name: "TrekYatra", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/images/Logo_Trekyatra.png` } },
  author: [{ "@type": "Person", name: "Deepesh Kumar Gupta", jobTitle: "Founder & Editorial Lead", url: `${SITE_URL}/about/authors` }],
};

export default function Authors() {
  return (
    <div className="container-narrow py-16 lg:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="mb-12">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Editorial team</div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">The people behind TrekYatra</h1>
        <p className="text-xl text-foreground/70 max-w-2xl">
          Field-tested, India-based, and built on the belief that trekkers deserve honest,
          verified information — not content optimised for clicks.
        </p>
      </div>

      {/* Founder card */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-2xl font-bold text-accent">D</span>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Deepesh Kumar Gupta</h2>
            <p className="text-sm text-accent font-medium mb-4">Founder &amp; Editorial Lead</p>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Deepesh is the founder of TrekYatra and the primary editorial lead, responsible for all
              content standards, platform strategy, and every guide that goes live on the site. He built
              TrekYatra out of a direct frustration with the quality of Indian trekking information
              online — outdated permit details, vague cost estimates, and operator-friendly rankings
              that serve everyone except the trekker.
            </p>
            <p className="text-foreground/80 leading-relaxed mb-4">
              His editorial philosophy is simple: every piece of information on TrekYatra must be
              verifiable, up-to-date, and honest — even when honesty means saying &ldquo;we are not
              sure, verify this at the trailhead.&rdquo;
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {["Content strategy", "Platform editorial", "Permit research", "Trek planning"].map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent font-medium">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial standards */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-8">
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">Our editorial standards</h2>
        <ul className="space-y-3">
          {[
            "Every guide is written or verified by someone with direct trail experience",
            "Permit information is re-verified every 14 days against official forest department sources",
            "Cost estimates are updated seasonally with actual operator and transport rates",
            "AI-assisted drafts go through mandatory human fact-check before publication",
            "Safety and YMYL claims (altitude, medical advisories, permits) require human sign-off",
            "No paid placement in editorial rankings — operators appear because of merit",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-foreground/80">
              <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Contribute */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-8">
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">Contribute to TrekYatra</h2>
        <p className="text-foreground/70 mb-4">
          We work with a network of contributing trekkers, operators, and outdoor educators for specific
          guides, permit updates, and seasonal reports. All contributors are credited on the pages they write.
        </p>
        <p className="text-sm text-foreground/80">
          If you have done a significant Indian trek recently and want to contribute, write to{" "}
          <a href="mailto:editorial@trekyatra.co.in" className="text-accent hover:underline font-medium">editorial@trekyatra.co.in</a>{" "}
          with your most recent trek date, the trail you want to cover, and a short sample.
        </p>
      </div>

      {/* Corrections */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">Submit a correction</h2>
        <p className="text-sm text-foreground/80">
          Found an outdated permit fee, wrong altitude, or incorrect route description? Write to{" "}
          <a href="mailto:editorial@trekyatra.co.in" className="text-accent hover:underline font-medium">editorial@trekyatra.co.in</a>.
          We respond within 24 hours and update the guide within 3 business days.
        </p>
      </div>
    </div>
  );
}
