"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Smartphone, ArrowRight, Check, AlertCircle } from "lucide-react";
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

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const next = searchParams.get("next") ?? "/account";
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="lg" className="w-full mb-3">
        <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email address"
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
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none transition-colors"
          />
        </div>
        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-accent transition-colors">Forgot password?</Link>
        </div>
        <Button variant="default" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
      <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
      <Button variant="outline" size="lg" className="w-full"><Smartphone className="h-4 w-4" /> Sign in with mobile OTP</Button>
      <p className="text-sm text-muted-foreground mt-6 text-center">New to TrekYatra? <Link href="/auth/sign-up" className="text-accent font-medium">Create account</Link></p>
    </>
  );
}

export default function SignIn() {
  return (
    <AuthLayout title="Welcome back" sub="Sign in to access your saved treks and planning workspace.">
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  );
}
