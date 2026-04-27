"use client";

import { Download } from "lucide-react";
import NewsletterCapture from "./NewsletterCapture";

interface Props {
  sourcePage: string;
  leadMagnet: string;
  resourceTitle: string;
  resourceDescription?: string;
}

export default function LeadMagnetCapture({ sourcePage, leadMagnet, resourceTitle, resourceDescription }: Props) {
  return (
    <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-6 my-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <Download className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Free download</p>
          <p className="font-semibold text-sm">{resourceTitle}</p>
        </div>
      </div>
      {resourceDescription && (
        <p className="text-sm text-muted-foreground mb-4">{resourceDescription}</p>
      )}
      <NewsletterCapture
        sourcePage={sourcePage}
        leadMagnet={leadMagnet}
        title="Get your free resource"
        subtitle="Enter your email and we'll send it instantly."
      />
    </div>
  );
}
