"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { adminLogin } from "@/lib/admin-auth-api";
import { Bot } from "lucide-react";

function AdminSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(email, password);
      router.push(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0e14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">TrekYatra</p>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5">
              Content Admin
            </p>
          </div>
        </div>

        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-6">
          <h1 className="font-display text-xl font-semibold text-white mb-1">
            Admin sign in
          </h1>
          <p className="text-white/40 text-sm mb-6">
            CMS access is restricted to authorised admins only.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-[#0c0e14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                placeholder="guyshazam12@gmail.com"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-[#0c0e14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors mt-1"
            >
              {loading ? "Signing in…" : "Sign in to Admin"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Not an admin?{" "}
          <a href="/" className="text-white/40 hover:text-white/60 underline transition-colors">
            Return to site
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0e14] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      }
    >
      <AdminSignInForm />
    </Suspense>
  );
}
