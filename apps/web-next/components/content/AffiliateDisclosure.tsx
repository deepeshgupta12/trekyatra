import Link from "next/link";

export default function AffiliateDisclosure() {
  return (
    <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-xl px-4 py-3 leading-relaxed">
      <strong className="text-foreground/70">Affiliate disclosure:</strong> Some links on this page may be affiliate links. We may earn a small commission at no extra cost to you. This helps us keep the content free.{" "}
      <Link href="/affiliate-disclosure" className="underline hover:text-foreground">Learn more</Link>.
    </div>
  );
}
