import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { ArrowRight, Check } from "lucide-react";

export default function OTP() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src="/images/hero-himalaya-dawn.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/30 to-transparent" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-surface">
          <Logo variant="light" />
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight max-w-md mb-6">Save treks. Compare routes. Plan with confidence.</h2>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12 bg-paper-grain">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="font-display text-4xl font-semibold leading-tight mb-2">Verify your number</h1>
          <p className="text-muted-foreground mb-8">We sent a 6-digit code to +91 ●●●●●●1234</p>
          <div className="flex gap-2 justify-center my-6">
            {[...Array(6)].map((_, i) => (
              <input key={i} maxLength={1} className="h-14 w-12 text-center text-xl font-display font-semibold rounded-xl border border-border bg-surface focus:border-accent outline-none" />
            ))}
          </div>
          <Button variant="hero" size="lg" className="w-full">Verify <ArrowRight className="h-4 w-4" /></Button>
          <p className="text-sm text-muted-foreground mt-4 text-center">Didn&apos;t receive it? <button className="text-accent font-medium">Resend in 0:42</button></p>
        </div>
      </div>
    </div>
  );
}
