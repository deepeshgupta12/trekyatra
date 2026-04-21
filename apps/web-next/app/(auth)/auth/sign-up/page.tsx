"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Smartphone, Check, User, AlertCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth-context";

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

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({
        email,
        password,
        full_name: fullName || undefined,
        display_name: fullName ? fullName.split(" ")[0] : undefined,
      });
      router.push("/auth/onboarding");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Start your trek journal" sub="Sign up free. Save treks, build comparisons, and plan smarter.">
      <Button variant="outline" size="lg" className="w-full mb-3">Continue with Google</Button>
      <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Full name (optional)"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none transition-colors"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none transition-colors"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none transition-colors"
          />
        </div>
        <Button variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-4 text-center">By signing up you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy</Link>.</p>
      <p className="text-sm text-muted-foreground mt-3 text-center">Already have an account? <Link href="/auth/sign-in" className="text-accent font-medium">Sign in</Link></p>
    </AuthLayout>
  );
}
