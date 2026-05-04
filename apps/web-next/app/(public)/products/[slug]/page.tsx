"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalProduct, fetchProduct, createCheckoutOrder, verifyPayment } from "@/lib/api";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct(slug)
      .then(setProduct)
      .catch(() => setError("Product not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBuy = useCallback(async () => {
    if (!product) return;
    setPaying(true);
    setError(null);

    try {
      const order = await createCheckoutOrder(product.slug);

      if (order.test_mode) {
        const result = await verifyPayment({ order_id: order.order_id });
        router.push(`/success/checkout?order_id=${result.order_id}`);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Payment gateway failed to load. Please try again.");
        setPaying(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount_inr * 100,
        currency: "INR",
        name: "TrekYatra",
        description: product.title,
        order_id: order.provider_order_id,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const result = await verifyPayment({
              order_id: order.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            router.push(`/success/checkout?order_id=${result.order_id}`);
          } catch {
            setError("Payment verification failed. Please contact support.");
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
        prefill: {},
        theme: { color: "#e8572b" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("401") || msg.includes("403")) {
        setError("Please sign in to purchase this product.");
      } else {
        setError(msg);
      }
      setPaying(false);
    }
  }, [product, router]);

  if (loading) {
    return (
      <div className="container-narrow py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container-narrow py-24 text-center">
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link href="/products"><Button variant="outline">Back to products</Button></Link>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container-narrow py-16 md:py-24">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All products
      </Link>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div>
          {product.preview_image_url ? (
            <img
              src={product.preview_image_url}
              alt={product.title}
              className="w-full rounded-2xl border border-border object-cover"
            />
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-accent/5 border border-border flex items-center justify-center">
              <Download className="h-16 w-16 text-accent/20" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
              Digital download
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold leading-snug mb-3">
              {product.title}
            </h1>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="font-display text-4xl font-semibold">₹{product.price_inr.toFixed(0)}</div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>
            )}

            <Button
              variant="hero"
              size="lg"
              className="w-full text-base"
              onClick={handleBuy}
              disabled={paying}
            >
              {paying ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Buy now — ₹{product.price_inr.toFixed(0)}</>
              )}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Instant download after payment · 24-hour download link
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Immediate access post-purchase</p>
            <p>• Download link valid for 24 hours (re-accessible from your account)</p>
            <p>• Secure payment via Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
