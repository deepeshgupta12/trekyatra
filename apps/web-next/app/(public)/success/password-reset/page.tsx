import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KeyRound, ArrowRight } from "lucide-react";
import { SuccessHero } from "@/components/success/SuccessHero";

export default function ResetPasswordSuccess() {
  return (
    <SuccessHero icon={KeyRound} eyebrow="All set" title="Password updated" sub="Your password has been changed. You're already signed in — pick up where you left off.">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/account"><Button variant="hero" size="lg">Go to dashboard <ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    </SuccessHero>
  );
}
