import type { Metadata } from "next";
import { ContentPage } from "@/components/content/ContentPage";
import { Shield } from "lucide-react";
import { fetchCMSPage } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await fetchCMSPage("privacy-policy").catch(() => null);
  return {
    title: cms?.seo_title ?? "Privacy Policy — TrekYatra",
    description: cms?.seo_description ?? "Read TrekYatra's privacy policy — what personal data we collect, how we use it, and how you can control your data.",
    alternates: { canonical: `${SITE_URL}/privacy` },
    robots: { index: true, follow: false },
  };
}

export default async function Privacy() {
  const cms = await fetchCMSPage("privacy-policy").catch(() => null);
  if (cms?.status === "published") {
    const schema = { "@context": "https://schema.org", "@type": "WebPage", name: cms.title, description: cms.seo_description ?? "", url: `${SITE_URL}/privacy`, publisher: { "@type": "Organization", name: "TrekYatra", url: SITE_URL } };
    return (
      <section className="container-wide py-16 lg:py-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">{cms.title}</h1>
        {cms.seo_description && <p className="text-xl text-foreground/70 mb-12 max-w-2xl">{cms.seo_description}</p>}
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: cms.content_html }} />
      </section>
    );
  }
  return (
    <ContentPage
      eyebrow="Privacy"
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, and how we protect it. Last updated: May 2026."
      icon={Shield}
      blocks={[
        {
          title: "1. What we collect",
          bullets: [
            "Account information: email address, full name, display name (when you register)",
            "Usage data: pages visited, search queries (aggregated, not personally attributed)",
            "Bookmarks and saved treks: to power your account dashboard",
            "Payment data: handled entirely by Razorpay or Stripe — we never store card details",
            "Email address: when you subscribe to the newsletter or submit an enquiry",
            "Lead form data: name, email, phone, trek interest when you contact an operator",
          ],
        },
        {
          title: "2. How we use your data",
          bullets: [
            "To provide and improve TrekYatra's content and features",
            "To send the Trail Letter newsletter (only if you opted in — unsubscribe any time)",
            "To route trek enquiries to the appropriate operators",
            "To send transactional emails: purchase receipts, password reset links",
            "To personalise trek recommendations based on your bookmarks",
            "We do not sell your data to third parties",
            "We do not use your data for advertising targeting on other platforms",
          ],
        },
        {
          title: "3. Cookies and tracking",
          body: "TrekYatra uses minimal cookies: session cookies for login state, and analytics cookies (Google Analytics 4) to understand aggregate usage patterns. We do not use advertising cookies. Disabling cookies in your browser will prevent login and saved-trek features from working.",
        },
        {
          title: "4. Third-party services",
          bullets: [
            "Google Analytics 4: aggregate usage analytics",
            "Google OAuth: if you sign in with Google, we receive your Google name and email",
            "Razorpay: payment processing for digital products (governed by Razorpay's privacy policy)",
            "Stripe: subscription billing (governed by Stripe's privacy policy)",
            "Mailchimp or Brevo: newsletter delivery if opted in",
          ],
        },
        {
          title: "5. Data retention",
          body: "We retain your account data for as long as your account is active. If you delete your account, we permanently delete your personal data within 30 days. Newsletter subscriber data is deleted immediately on unsubscribe.",
        },
        {
          title: "6. Your rights",
          bullets: [
            "Access: request a copy of your data",
            "Correction: request correction of inaccurate data",
            "Deletion: request deletion of your account and all associated data",
            "Portability: request your data in a machine-readable format",
            "Withdrawal: withdraw newsletter consent at any time via the unsubscribe link",
          ],
        },
        {
          title: "7. Security",
          body: "Passwords are stored as one-way PBKDF2-SHA256 hashes. Session tokens are stored as SHA-256 hashes. HTTPS is enforced on all connections.",
        },
        {
          title: "Contact",
          body: "For privacy questions or data requests: hello@trekyatra.in — we respond within 5 business days.",
        },
      ]}
    />
  );
}
