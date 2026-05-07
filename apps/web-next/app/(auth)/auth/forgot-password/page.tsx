"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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

          {sent ? (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h1 className="font-display text-3xl font-semibold mb-2">Check your inbox</h1>
              <p className="text-muted-foreground mb-6">
                If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your spam folder if you don't see it within a few minutes.
              </p>
              <Link href="/auth/sign-in">
                <Button variant="outline" className="w-full">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Reset your password</h1>
              <p className="text-muted-foreground mb-8">Enter your email and we&apos;ll send you a secure reset link valid for 1 hour.</p>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button variant="hero" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Sending…" : <><span>Send reset link</span><ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
              <p className="text-sm text-muted-foreground mt-6 text-center">
                Remembered it? <Link href="/auth/sign-in" className="text-accent font-medium">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
