"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Smartphone, Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

function AuthLayout({ children, title, sub }: { children: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src="/images/hero-himalaya-dawn.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/30 to-transparent" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-surface">
          <Logo variant="light" />
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight max-w-md mb-6">Save treks. Compare routes. Plan with confidence.</h2>
            <ul className="space-y-2 text-surface/85">
              {["Save unlimited treks", "Build comparison lists", "Download premium resources", "Get permit alerts"].map(x => (
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
}

function Field({ icon: Icon, ...props }: any) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input {...props} className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none transition-colors" />
    </div>
  );
}

export default function SignUp() {
  return (
    <AuthLayout title="Start your trek journal" sub="Sign up free. Save treks, build comparisons, and plan smarter.">
      <Button variant="outline" size="lg" className="w-full mb-3">Continue with Google</Button>
      <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Field icon={Mail} type="email" placeholder="Email" />
        <Field icon={Smartphone} type="tel" placeholder="Mobile number" />
        <Field icon={Lock} type="password" placeholder="Password" />
        <Button variant="hero" size="lg" className="w-full">Create account</Button>
      </form>
      <p className="text-xs text-muted-foreground mt-4 text-center">By signing up you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy</Link>.</p>
    </AuthLayout>
  );
}
