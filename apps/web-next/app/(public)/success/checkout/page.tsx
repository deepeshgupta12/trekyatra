import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { SuccessHero } from "@/components/success/SuccessHero";

export default function CheckoutSuccess() {
  return (
    <SuccessHero icon={Download} eyebrow="Payment confirmed" title="Your download is ready" sub="The Himalayan Packing System is in your account and we've also emailed the link.">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center"><FileText className="h-6 w-6 text-accent" /></div>
          <div className="flex-1 text-left">
            <div className="font-display text-lg font-semibold">Himalayan Packing System</div>
            <div className="text-xs text-muted-foreground">PDF · 24 pages · 2.4 MB</div>
          </div>
          <Button variant="hero" size="default"><Download className="h-4 w-4" /> Download</Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/account/downloads"><Button variant="outline" size="lg">My downloads</Button></Link>
        <Link href="/products"><Button variant="ghost" size="lg">Browse more resources</Button></Link>
      </div>
    </SuccessHero>
  );
}
