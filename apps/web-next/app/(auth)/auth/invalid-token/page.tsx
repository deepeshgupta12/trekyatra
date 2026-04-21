import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvalidToken() {
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
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Link expired</h1>
          <p className="text-muted-foreground mb-8">This reset link is invalid or has expired. Reset links are only valid for 30 minutes.</p>
          <Button variant="hero" size="lg" className="w-full mb-3" asChild>
            <Link href="/auth/forgot-password">Request a new link</Link>
          </Button>
          <p className="text-sm text-muted-foreground">Remembered it? <Link href="/auth/sign-in" className="text-accent font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
