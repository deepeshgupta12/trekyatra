import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
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
        <div className="w-full max-w-md text-center">
          <div className="lg:hidden mb-8 flex justify-center"><Logo /></div>
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Check your inbox</h1>
          <p className="text-muted-foreground mb-8">We sent a verification link to your email. Click it to activate your TrekYatra account.</p>
          <div className="bg-surface rounded-2xl border border-border p-6 mb-6 text-left space-y-3">
            <p className="text-sm font-medium">Didn&apos;t get the email?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Check your spam or promotions folder</li>
              <li>Make sure you typed the right email</li>
              <li>Allow a minute or two for delivery</li>
            </ul>
          </div>
          <Button variant="hero" size="lg" className="w-full mb-3">Resend verification email <ArrowRight className="h-4 w-4" /></Button>
          <p className="text-sm text-muted-foreground">Wrong email? <Link href="/auth/sign-up" className="text-accent font-medium">Go back</Link></p>
        </div>
      </div>
    </div>
  );
}
