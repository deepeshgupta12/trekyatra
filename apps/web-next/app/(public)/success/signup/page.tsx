import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { SuccessHero } from "@/components/success/SuccessHero";

export default function SignupSuccess() {
  return (
    <SuccessHero icon={CheckCircle2} eyebrow="Account created" title="Welcome to TrekYatra" sub="Let's tune your feed — pick your fitness level and favourite regions in 30 seconds.">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/auth/onboarding"><Button variant="hero" size="lg">Set preferences <ArrowRight className="h-4 w-4" /></Button></Link>
        <Link href="/account"><Button variant="ghost" size="lg">Skip for now</Button></Link>
      </div>
    </SuccessHero>
  );
}
