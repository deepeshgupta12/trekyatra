"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Lock, CheckCircle } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div>
        <p className="text-destructive mb-4">Invalid or missing reset token. Please request a new reset link.</p>
        <Link href="/auth/forgot-password">
          <Button variant="outline" className="w-full">Request new link</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.detail ?? "Reset failed. The link may have expired.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <h2 className="font-display text-2xl font-semibold mb-2">Password updated!</h2>
        <p className="text-muted-foreground mb-6">You can now sign in with your new password.</p>
        <Button variant="hero" className="w-full" onClick={() => router.push("/auth/sign-in")}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Set new password</h1>
      <p className="text-muted-foreground mb-8">Choose a new password for your TrekYatra account.</p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button variant="hero" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Updating…" : "Set new password"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src="/images/hero-himalaya-dawn.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/30 to-transparent" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-surface">
          <Logo variant="light" />
          <h2 className="font-display text-4xl font-semibold leading-tight max-w-md">Save treks. Compare routes. Plan with confidence.</h2>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12 bg-paper-grain">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded-xl" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
