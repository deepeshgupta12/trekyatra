"use client";

import { useState } from "react";
import {
  Root as _DialogRoot,
  Portal as _DialogPortal,
  Overlay as _DialogOverlay,
  Content as _DialogContent,
  Close as _DialogClose,
  Title as _DialogTitle,
  Description as _DialogDescription,
} from "@radix-ui/react-dialog";

// Cast to ElementType to work around radix-ui@1.1.15 + @types/react@18 JSX incompatibility
const DRoot = _DialogRoot as React.ElementType;
const DPortal = _DialogPortal as React.ElementType;
const DOverlay = _DialogOverlay as React.ElementType;
const DContent = _DialogContent as React.ElementType;
const DClose = _DialogClose as React.ElementType;
const DTitle = _DialogTitle as React.ElementType;
const DDescription = _DialogDescription as React.ElementType;
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import {
  Mail, Lock, User, AlertCircle, Eye, EyeOff, X,
  Mountain,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called immediately after successful sign-in or sign-up */
  onSuccess: () => void;
}

type Mode = "sign-in" | "sign-up";

export default function AuthGateModal({ open, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const { login, signup, loginWithGoogle } = useAuth();

  // Shared state
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  function resetForm() {
    setEmail(""); setPassword(""); setFullName("");
    setShowPw(false); setError(""); setLoading(false);
  }

  function switchMode(m: Mode) {
    resetForm();
    setMode(m);
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  async function handleGoogleToken(accessToken: string) {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(accessToken);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── Email sign-in ─────────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  // ── Email sign-up ─────────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signup({
        email,
        password,
        full_name: fullName || undefined,
        display_name: fullName ? fullName.split(" ")[0] : undefined,
      });
      // Skip onboarding for plan flow — user gets results immediately
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const GoogleButton = (
    <GoogleAuthButton
      onToken={handleGoogleToken}
      onError={() => setError("Google sign-in failed. Please try again.")}
      disabled={loading}
    />
  );

  const Divider = (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );

  return (
    <DRoot open={open} onOpenChange={(v: boolean) => { if (!v) onClose(); }}>
      <DPortal>
        <DOverlay className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DContent className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-paper-grain rounded-2xl shadow-2xl p-8 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%] max-h-[90vh] overflow-y-auto">

          {/* Close */}
          <DClose asChild>
            <button
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </DClose>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Mountain className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DTitle className="font-display text-xl font-semibold leading-tight">
                {mode === "sign-in" ? "Sign in to see your results" : "Create a free account"}
              </DTitle>
              <DDescription className="text-sm text-muted-foreground mt-0.5">
                Your trek recommendations will be ready immediately after.
              </DDescription>
            </div>
          </div>

          {/* Google */}
          {GoogleButton}

          {Divider}

          {/* ── Sign-in form ─────────────────────────────────────── */}
          {mode === "sign-in" && (
            <form className="space-y-3" onSubmit={handleSignIn}>
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
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-11 rounded-xl border border-border bg-surface focus:border-accent outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button variant="default" size="lg" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in & see my treks"}
              </Button>
            </form>
          )}

          {/* ── Sign-up form ─────────────────────────────────────── */}
          {mode === "sign-up" && (
            <form className="space-y-3" onSubmit={handleSignUp}>
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
                  type={showPw ? "text" : "password"}
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full h-12 pl-11 pr-11 rounded-xl border border-border bg-surface focus:border-accent outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account & see my treks"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By signing up you agree to our Terms and Privacy Policy.
              </p>
            </form>
          )}

          {/* Toggle */}
          <p className="text-sm text-muted-foreground mt-5 text-center">
            {mode === "sign-in" ? (
              <>New to TrekYatra?{" "}
                <button onClick={() => switchMode("sign-up")} className="text-accent font-medium hover:underline">
                  Create free account
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => switchMode("sign-in")} className="text-accent font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </DContent>
      </DPortal>
    </DRoot>
  );
}
