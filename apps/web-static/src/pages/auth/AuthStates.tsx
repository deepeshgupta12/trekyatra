import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Mail, Lock, ArrowRight, Check, AlertTriangle, MailCheck, KeyRound, XCircle, Mountain, Compass, Bookmark, Bell } from "lucide-react";
import himalaya from "@/assets/hero-himalaya-dawn.jpg";

const AuthLayout = ({ children, title, sub }: any) => (
  <div className="min-h-screen grid lg:grid-cols-2">
    <div className="relative hidden lg:block">
      <img src={himalaya} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/30 to-transparent" />
      <div className="absolute inset-0 p-12 flex flex-col justify-between text-surface">
        <Logo variant="light" />
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight max-w-md mb-6">Save treks. Compare routes. Plan with confidence.</h2>
          <ul className="space-y-2 text-surface/85">
            {["Save unlimited treks","Build comparison lists","Download premium resources","Get permit alerts"].map(x => (
              <li key={x} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-accent-glow" /> {x}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-center p-6 md:p-12 bg-paper-grain">
      <div className="w-full max-w-md">
        <div className="lg:hidden mb-8"><Logo /></div>
        <h1 className="font-display text-4xl font-semibold leading-tight mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8">{sub}</p>
        {children}
      </div>
    </div>
  </div>
);

const Field = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <input {...props} className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none transition-colors" />
  </div>
);

export const ForgotPassword = () => (
  <AuthLayout title="Reset your password" sub="Enter your email and we'll send you a secure reset link.">
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <Field icon={Mail} type="email" placeholder="Email address" />
      <Button variant="hero" size="lg" className="w-full">Send reset link <ArrowRight className="h-4 w-4" /></Button>
    </form>
    <p className="text-sm text-muted-foreground mt-6 text-center">
      Remembered it? <Link to="/auth/sign-in" className="text-accent font-medium">Sign in</Link>
    </p>
  </AuthLayout>
);

export const ResetPassword = () => (
  <AuthLayout title="Set a new password" sub="Choose a strong password — at least 8 characters with one number.">
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <Field icon={Lock} type="password" placeholder="New password" />
      <Field icon={Lock} type="password" placeholder="Confirm new password" />
      <Button variant="hero" size="lg" className="w-full">Update password</Button>
    </form>
  </AuthLayout>
);

export const VerifyEmail = () => (
  <AuthLayout title="Check your inbox" sub="We sent a verification link to aarav@trail.in. Click it to activate your account.">
    <div className="flex items-center justify-center py-8">
      <div className="h-24 w-24 rounded-full bg-accent/15 flex items-center justify-center">
        <MailCheck className="h-12 w-12 text-accent" />
      </div>
    </div>
    <Button variant="outline" size="lg" className="w-full mb-3">Open email app</Button>
    <p className="text-sm text-muted-foreground text-center">
      Didn't get it? <button className="text-accent font-medium">Resend in 0:42</button>
    </p>
  </AuthLayout>
);

export const InvalidToken = () => (
  <AuthLayout title="Link expired" sub="This verification link is no longer valid. Request a new one and we'll send it right away.">
    <div className="flex items-center justify-center py-6">
      <div className="h-24 w-24 rounded-full bg-destructive/15 flex items-center justify-center">
        <XCircle className="h-12 w-12 text-destructive" />
      </div>
    </div>
    <Button variant="hero" size="lg" className="w-full">Request new link</Button>
    <Link to="/auth/sign-in" className="block text-sm text-muted-foreground text-center mt-4">Back to sign in</Link>
  </AuthLayout>
);

export const Onboarding = () => (
  <SiteLayout>
    <section className="py-16 md:py-24 bg-gradient-paper min-h-[80vh]">
      <div className="container-narrow">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs uppercase tracking-widest mb-5">
            <Mountain className="h-3 w-3 text-accent" /> Step 1 of 3
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-3">Tell us about your trekking style</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">We'll personalise trek picks, packing tips and seasonal alerts to match.</p>
        </div>
        <div className="space-y-8">
          <div>
            <div className="font-display text-lg font-semibold mb-4">What's your fitness level?</div>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { l: "Beginner", d: "First Himalayan trek" },
                { l: "Intermediate", d: "2-5 treks done" },
                { l: "Advanced", d: "Multi-day high-altitude" },
              ].map((x, i) => (
                <button key={x.l} className={`p-5 text-left rounded-2xl border-2 transition-colors ${i === 1 ? 'border-accent bg-accent/5' : 'border-border bg-card hover:border-accent/50'}`}>
                  <div className="font-display text-lg font-semibold mb-1">{x.l}</div>
                  <div className="text-xs text-muted-foreground">{x.d}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-semibold mb-4">Which regions interest you?</div>
            <div className="flex flex-wrap gap-2">
              {["Himachal","Uttarakhand","Kashmir","Ladakh","Sahyadris","Karnataka","Sikkim","North East"].map(r => (
                <button key={r} className="px-4 py-2 rounded-full border border-border bg-card hover:border-accent hover:bg-accent/5 text-sm transition-colors">{r}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-semibold mb-4">When are you planning your next trek?</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Next month","2-3 months","6 months","Just exploring"].map(x => (
                <button key={x} className="p-4 rounded-xl border border-border bg-card hover:border-accent text-sm">{x}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-6">
            <button className="text-sm text-muted-foreground">Skip for now</button>
            <Button variant="hero" size="lg">Continue <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </section>
  </SiteLayout>
);
