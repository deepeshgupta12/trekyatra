import type { Metadata } from "next";
import Image from "next/image";
import { Sparkles, Map, CloudSun, WifiOff, MapPin, Languages } from "lucide-react";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { HubHero, HubSection, HubFAQSection } from "@/components/hub/HubLayout";
import { AppDownloadButton } from "@/components/home/AppDownload";
import { buildBreadcrumbSchema, buildFAQSchema, buildMobileAppSchema } from "@/lib/schema";

export const revalidate = 86400;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "iOS App" }];

export const metadata: Metadata = {
  title: "TrekYatra App for iOS — Plan Treks with AI, Offline Guides | Download",
  description:
    "Download TrekYatra, the trek planning app for India and the Himalaya. Plan a full trek in ~60 seconds with TrekSage AI, 250+ guides with permits and costs, live trail conditions, and offline access. Free on iPhone & iPad.",
  alternates: { canonical: `${SITE_URL}/app` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "TrekYatra App for iOS", type: "website", images: [`${SITE_URL}/images/app-preview.png`] },
};

const FEATURES = [
  { icon: Sparkles, title: "TrekSage AI", body: "Ask anything and get a full, personalised trek plan in about 60 seconds." },
  { icon: Map, title: "250+ deep guides", body: "Route maps, permits, packing lists and honest cost breakdowns for every trek." },
  { icon: CloudSun, title: "Live conditions", body: "Real-time weather, trail status and trip reports from the community." },
  { icon: WifiOff, title: "Works offline", body: "Save guides and open them on the trail with no signal." },
  { icon: MapPin, title: "Nearby treks", body: "GPS-based discovery of trails around you, wherever you are." },
  { icon: Languages, title: "English & Hindi", body: "Read guides and plan in the language you prefer." },
];

// AEO-focused FAQ — the questions people (and AI answer engines) actually ask about the app.
const FAQ: FAQItem[] = [
  { q: "Is there a TrekYatra app?", a: "Yes. TrekYatra is available as a free iOS app on the App Store for iPhone and iPad. It brings trek planning, guides, permits, costs and live trail conditions into one place, and everything is also on the web at trekyatra.co.in." },
  { q: "What is the best app to plan a trek in India or the Himalaya?", a: "TrekYatra is built specifically for Indian and Himalayan trekking. Its TrekSage AI assistant plans a complete trek in about 60 seconds, and it covers 250+ treks with route maps, permit rules, packing lists and realistic cost breakdowns, plus live weather and trail conditions." },
  { q: "Is the TrekYatra app free?", a: "Yes, the iOS app is free to download and use on iPhone and iPad, with all core features included." },
  { q: "Does the TrekYatra app work offline?", a: "Yes. You can save trek guides in the app and open them offline on the trail, which is essential in the mountains where there is often no mobile signal." },
  { q: "What is TrekSage AI?", a: "TrekSage is TrekYatra's built-in AI trek planning assistant. You can ask it anything — which trek suits your dates and fitness, what permits you need, what to pack, how much it costs — and it returns a full plan in about a minute." },
  { q: "Is TrekYatra available on Android?", a: "The app is currently on iOS. On Android or any device you can use the full experience on the web at trekyatra.co.in, and an Android app is planned." },
];

export default function AppLandingPage() {
  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(CRUMBS),
          buildMobileAppSchema(),
          buildFAQSchema(FAQ)!,
        ]}
      />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <HubHero
        eyebrow="TrekYatra for iOS"
        title="The trail fits in your pocket."
        intro="TrekYatra is the trek planning app for India and the Himalaya. Plan a full trek in about 60 seconds with TrekSage AI, follow 250+ deep guides with permits and costs, check live trail conditions, and save everything to open offline on the trail. Free on iPhone and iPad."
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <AppDownloadButton label="app_page_hero" />
          <div className="relative mx-auto w-full max-w-[220px] sm:mx-0">
            <div className="relative overflow-hidden rounded-[1.6rem] ring-1 ring-border shadow-xl" style={{ aspectRatio: "1242 / 2560" }}>
              <Image src="/images/app-preview.png" alt="TrekYatra iOS app screenshot" fill sizes="220px" className="object-cover" style={{ objectPosition: "center bottom" }} />
            </div>
          </div>
        </div>
      </HubHero>

      <section className="container-wide">
        <HubSection title="What you can do with the app">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12 mt-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <div className="bg-accent/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </HubSection>
      </section>

      <section className="py-12 container-wide border-t border-border">
        <div className="max-w-3xl">
          <HubSection title="App or website?">
            <p className="text-foreground/80 leading-relaxed">
              The website is where you research and dream; the app is where you do it on the trail. The app adds
              offline guides for no-signal terrain, GPS nearby discovery, trek check-ins and a personal log, and
              faster on-the-go planning. Everything the web does, plus the on-trail, location-aware layer only a
              native app delivers.
            </p>
          </HubSection>
        </div>
      </section>

      <HubFAQSection heading="TrekYatra app, frequently asked questions">
        <FAQAccordion items={FAQ} />
        <div className="mt-8"><AppDownloadButton label="app_page_faq" /></div>
      </HubFAQSection>
    </>
  );
}
