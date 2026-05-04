"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { SuccessHero } from "@/components/success/SuccessHero";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface DownloadInfo {
  download_url: string | null;
  product_title?: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [info, setInfo] = useState<DownloadInfo | null>(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;
    fetch(`${API}/api/v1/account/downloads/${orderId}/url`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setInfo(data))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <SuccessHero
      icon={Download}
      eyebrow="Payment confirmed"
      title="Your download is ready"
      sub="Your file is in your account — we've also emailed the download link."
    >
      <div className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="font-display text-lg font-semibold truncate">
              {info?.product_title ?? "Your purchase"}
            </div>
            <div className="text-xs text-muted-foreground">Digital download · ready now</div>
          </div>

          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : info?.download_url ? (
            <a href={info.download_url} target="_blank" rel="noopener noreferrer">
              <Button variant="hero" size="default">
                <Download className="h-4 w-4 mr-1.5" /> Download
              </Button>
            </a>
          ) : (
            <Link href="/account/downloads">
              <Button variant="outline" size="default">My downloads</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/account/downloads">
          <Button variant="outline" size="lg">My downloads</Button>
        </Link>
        <Link href="/products">
          <Button variant="ghost" size="lg">Browse more resources</Button>
        </Link>
      </div>
    </SuccessHero>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <SuccessHero icon={Download} eyebrow="Payment confirmed" title="Your download is ready" sub="">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SuccessHero>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
