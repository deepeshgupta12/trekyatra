"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Lock } from "lucide-react";

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
          <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Set a new password</h1>
          <p className="text-muted-foreground mb-8">Choose a strong password — at least 8 characters with one number.</p>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" placeholder="New password" className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none" />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" placeholder="Confirm new password" className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-surface focus:border-accent outline-none" />
            </div>
            <Button variant="hero" size="lg" className="w-full">Update password</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
