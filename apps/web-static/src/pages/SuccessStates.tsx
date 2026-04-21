import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Download, ArrowRight, Sparkles, Calendar, Clock, FileText, Mountain, KeyRound } from "lucide-react";

const SuccessHero = ({ icon: Icon, eyebrow, title, sub, children }: any) => (
  <SiteLayout>
    <section className="py-20 md:py-28 bg-gradient-paper relative overflow-hidden min-h-[80vh] flex items-center">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1200 600" preserveAspectRatio="none">
          <path d="M0,500 L150,420 L300,460 L450,360 L600,420 L750,300 L900,380 L1050,320 L1200,400 L1200,600 L0,600 Z" fill="hsl(var(--primary))" />
        </svg>
      </div>
      <div className="container-narrow relative text-center">
        <div className="relative inline-flex items-center justify-center mb-7">
          <div className="absolute inset-0 bg-success/30 blur-2xl rounded-full" />
          <div className="relative h-20 w-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
            <Icon className="h-10 w-10 text-success" strokeWidth={2.25} />
          </div>
        </div>
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">{eyebrow}</div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4 max-w-2xl mx-auto">{title}</h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">{sub}</p>
        {children}
      </div>
    </section>
  </SiteLayout>
);

export const NewsletterSuccess = () => (
  <SuccessHero icon={Mail} eyebrow="You're in" title="Welcome to The Trail Letter" sub="Confirm your email — we just sent a single-tap verification link to your inbox.">
    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
      <Button variant="hero" size="lg">Open email app</Button>
      <Link to="/explore"><Button variant="outline" size="lg">Browse treks <ArrowRight className="h-4 w-4" /></Button></Link>
    </div>
    <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
      {[
        { i: Calendar, t: "First letter", d: "Arrives next Sunday" },
        { i: Sparkles, t: "Curation", d: "Seasonal picks for your region" },
        { i: Mountain, t: "No spam", d: "One slow email a month" },
      ].map(b => (
        <div key={b.t} className="p-5 bg-card border border-border rounded-2xl">
          <b.i className="h-5 w-5 text-accent mb-2" />
          <div className="font-display font-semibold mb-1">{b.t}</div>
          <div className="text-sm text-muted-foreground">{b.d}</div>
        </div>
      ))}
    </div>
  </SuccessHero>
);

export const PlanSuccess = () => (
  <SuccessHero icon={CheckCircle2} eyebrow="Enquiry received" title="We've got it. Now it's our turn." sub="A real human from our planning team will reach out within 48 hours with shortlisted operators and honest pricing.">
    <div className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto text-left mb-8">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">What happens next</div>
      <div className="space-y-4">
        {[
          { n: "01", t: "Within 4 hours", d: "Confirmation email with your enquiry summary" },
          { n: "02", t: "Within 48 hours", d: "3 vetted operator quotes + an editor recommendation" },
          { n: "03", t: "Within 5 days", d: "Curated itinerary, packing list and permit checklist" },
        ].map(s => (
          <div key={s.n} className="flex gap-4">
            <div className="font-display text-2xl font-semibold text-accent w-10 flex-shrink-0">{s.n}</div>
            <div>
              <div className="font-semibold">{s.t}</div>
              <div className="text-sm text-muted-foreground">{s.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/account/enquiries"><Button variant="hero" size="lg">Track your enquiry</Button></Link>
      <Link to="/explore"><Button variant="outline" size="lg">Keep exploring</Button></Link>
    </div>
  </SuccessHero>
);

export const CheckoutSuccess = () => (
  <SuccessHero icon={Download} eyebrow="Payment confirmed" title="Your download is ready" sub="The Himalayan Packing System is in your account and we've also emailed the link.">
    <div className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto mb-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center"><FileText className="h-6 w-6 text-accent" /></div>
        <div className="flex-1 text-left">
          <div className="font-display text-lg font-semibold">Himalayan Packing System</div>
          <div className="text-xs text-muted-foreground">PDF · 24 pages · 2.4 MB</div>
        </div>
        <Button variant="hero" size="default"><Download className="h-4 w-4" /> Download</Button>
      </div>
    </div>
    <div className="text-xs text-muted-foreground mb-8">Order #TY-3829 · Receipt sent to aarav@trail.in</div>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/account/downloads"><Button variant="outline" size="lg">My downloads</Button></Link>
      <Link to="/products"><Button variant="ghost" size="lg">Browse more resources</Button></Link>
    </div>
  </SuccessHero>
);

export const ResetPasswordSuccess = () => (
  <SuccessHero icon={KeyRound} eyebrow="All set" title="Password updated" sub="Your password has been changed. You're already signed in — pick up where you left off.">
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/account"><Button variant="hero" size="lg">Go to dashboard <ArrowRight className="h-4 w-4" /></Button></Link>
    </div>
  </SuccessHero>
);

export const SignupSuccess = () => (
  <SuccessHero icon={CheckCircle2} eyebrow="Account created" title="Welcome to TrekYatra" sub="Let's tune your feed — pick your fitness level and favourite regions in 30 seconds.">
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/auth/onboarding"><Button variant="hero" size="lg">Set preferences <ArrowRight className="h-4 w-4" /></Button></Link>
      <Link to="/account"><Button variant="ghost" size="lg">Skip for now</Button></Link>
    </div>
  </SuccessHero>
);
