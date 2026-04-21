"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Mail, ArrowRight, Check } from "lucide-react";

export default function ForgotPassword() {
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
          <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Reset your password</h1>
          <p className="text-muted-foreground mb-8">Enter your email and we&apos;ll send you a secure reset link.</p>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="Email address" className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none" />
            </div>
            <Button variant="hero" size="lg" className="w-full">Send reset link <ArrowRight className="h-4 w-4" /></Button>
          </form>
          <p className="text-sm text-muted-foreground mt-6 text-center">Remembered it? <Link href="/auth/sign-in" className="text-accent font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
