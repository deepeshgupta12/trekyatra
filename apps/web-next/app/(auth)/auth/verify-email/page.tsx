"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Mail, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function callVerifyEmail(token: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, message: data.message ?? (res.ok ? "Email verified." : "Invalid or expired link.") };
}

async function callSendVerification(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/send-verification`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, message: data.message ?? (res.ok ? "Verification email sent." : data.detail ?? "Failed to send.") };
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const token = searchParams?.get("token") ?? null;

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const verify = useCallback(async (tok: string) => {
    setStatus("verifying");
    const result = await callVerifyEmail(tok);
    setStatus(result.ok ? "success" : "error");
    setMessage(result.message);
    if (result.ok) {
      await refresh();
    }
  }, [refresh]);

  useEffect(() => {
    if (token) void verify(token);
  }, [token, verify]);

  async function handleResend() {
    setResendStatus("sending");
    const result = await callSendVerification();
    setResendStatus(result.ok ? "sent" : "error");
    setMessage(result.message);
  }

  const panel = (
    <div className="relative hidden lg:block">
      <img src="/images/hero-himalaya-dawn.jpg" alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/30 to-transparent" />
      <div className="absolute inset-0 p-12 flex flex-col justify-between text-surface">
        <Logo variant="light" />
        <h2 className="font-display text-4xl font-semibold leading-tight max-w-md">
          Save treks. Compare routes. Plan with confidence.
        </h2>
      </div>
    </div>
  );

  if (status === "verifying") {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        {panel}
        <div className="flex items-center justify-center p-6 md:p-12 bg-paper-grain">
          <div className="w-full max-w-md text-center">
            <div className="lg:hidden mb-8 flex justify-center"><Logo /></div>
            <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto mb-6" />
            <h1 className="font-display text-3xl font-semibold mb-2">Verifying your email…</h1>
            <p className="text-muted-foreground">Just a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        {panel}
        <div className="flex items-center justify-center p-6 md:p-12 bg-paper-grain">
          <div className="w-full max-w-md text-center">
            <div className="lg:hidden mb-8 flex justify-center"><Logo /></div>
            <div className="w-16 h-16 rounded-2xl bg-pine/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-pine" />
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Email verified</h1>
            <p className="text-muted-foreground mb-8">Your TrekYatra account is now active.</p>
            <Button variant="hero" size="lg" className="w-full" onClick={() => router.push("/account")}>
              Go to my account <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        {panel}
        <div className="flex items-center justify-center p-6 md:p-12 bg-paper-grain">
          <div className="w-full max-w-md text-center">
            <div className="lg:hidden mb-8 flex justify-center"><Logo /></div>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight mb-2">Link expired</h1>
            <p className="text-muted-foreground mb-8">{message || "This verification link is invalid or has expired. Request a new one below."}</p>
            {user && !user.is_verified_email && (
              <Button
                variant="hero"
                size="lg"
                className="w-full mb-3"
                onClick={handleResend}
                disabled={resendStatus === "sending" || resendStatus === "sent"}
              >
                {resendStatus === "sending" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {resendStatus === "sent" ? "Email sent — check your inbox" : "Resend verification email"}
              </Button>
            )}
            <Link href="/account" className="text-sm text-accent font-medium">Go to account</Link>
          </div>
        </div>
      </div>
    );
  }

  // No token — "check your inbox" state (reached right after signup)
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {panel}
      <div className="flex items-center justify-center p-6 md:p-12 bg-paper-grain">
        <div className="w-full max-w-md text-center">
          <div className="lg:hidden mb-8 flex justify-center"><Logo /></div>
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Check your inbox</h1>
          <p className="text-muted-foreground mb-8">
            We sent a verification link to your email. Click it to activate your TrekYatra account.
          </p>
          <div className="bg-surface rounded-2xl border border-border p-6 mb-6 text-left space-y-3">
            <p className="text-sm font-medium">Didn&apos;t get the email?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Check your spam or promotions folder</li>
              <li>Make sure you typed the right email</li>
              <li>Allow a minute or two for delivery</li>
            </ul>
          </div>
          <Button
            variant="hero"
            size="lg"
            className="w-full mb-3"
            onClick={handleResend}
            disabled={resendStatus === "sending" || resendStatus === "sent"}
          >
            {resendStatus === "sending" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {resendStatus === "sent" ? "Email sent — check your inbox" : "Resend verification email"}
            {resendStatus === "idle" && <ArrowRight className="h-4 w-4" />}
          </Button>
          {resendStatus === "error" && (
            <p className="text-sm text-red-500 mb-2">{message || "Failed to send. Please try again."}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Wrong email? <Link href="/auth/sign-up" className="text-accent font-medium">Go back</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
