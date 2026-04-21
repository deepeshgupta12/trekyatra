import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Lock } from "lucide-react";

export default function Checkout() {
  return (
    <section className="py-12 bg-gradient-paper min-h-[80vh]">
      <div className="container-wide grid lg:grid-cols-[1fr_400px] gap-10 items-start">
        <div>
          <Link href="/products" className="text-sm text-muted-foreground mb-4 inline-block">← Back</Link>
          <h1 className="font-display text-4xl font-semibold mb-8">Checkout</h1>
          <div className="space-y-6">
            <div className="p-6 bg-card border border-border rounded-2xl">
              <h3 className="font-display text-lg font-semibold mb-4">Your details</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <input placeholder="Full name" className="h-12 px-4 rounded-xl border border-border bg-surface text-sm" />
                <input placeholder="Email" type="email" className="h-12 px-4 rounded-xl border border-border bg-surface text-sm" />
                <input placeholder="Mobile" className="h-12 px-4 rounded-xl border border-border bg-surface text-sm md:col-span-2" />
              </div>
            </div>
            <div className="p-6 bg-card border border-border rounded-2xl">
              <h3 className="font-display text-lg font-semibold mb-4">Payment</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {["Card", "UPI", "Netbanking"].map((p, i) => (
                  <button key={p} className={`h-11 rounded-xl border-2 text-sm font-medium ${i === 0 ? "border-accent bg-accent/5 text-accent" : "border-border bg-card"}`}>{p}</button>
                ))}
              </div>
              <input placeholder="Card number" className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-sm mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="MM / YY" className="h-12 px-4 rounded-xl border border-border bg-surface text-sm" />
                <input placeholder="CVV" className="h-12 px-4 rounded-xl border border-border bg-surface text-sm" />
              </div>
            </div>
          </div>
        </div>
        <aside className="lg:sticky lg:top-24 p-6 bg-card border border-border rounded-2xl stack-shadow">
          <h3 className="font-display text-lg font-semibold mb-4">Order summary</h3>
          <div className="flex gap-3 pb-4 border-b border-border">
            <div className="h-16 w-16 rounded-lg bg-gradient-paper flex items-center justify-center">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Himalayan Packing System</div>
              <div className="text-xs text-muted-foreground">PDF · 24 pages</div>
            </div>
            <div className="text-sm font-semibold">₹299</div>
          </div>
          <div className="space-y-2 py-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹299</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹54</span></div>
          </div>
          <div className="flex justify-between items-baseline pt-4 border-t border-border mb-5">
            <span className="font-display text-lg font-semibold">Total</span>
            <span className="font-display text-2xl font-semibold">₹353</span>
          </div>
          <Button variant="hero" size="lg" className="w-full mb-3"><Lock className="h-4 w-4" /> Pay ₹353</Button>
          <div className="text-xs text-muted-foreground text-center">Secure payment · Instant download</div>
        </aside>
      </div>
    </section>
  );
}
