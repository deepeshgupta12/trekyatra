"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ShoppingBag, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalProduct, fetchProducts } from "@/lib/api";

function ProductCard({ product }: { product: DigitalProduct }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col hover:border-accent/40 transition-colors">
      {product.preview_image_url ? (
        <img src={product.preview_image_url} alt={product.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-accent/5 flex items-center justify-center">
          <Download className="h-10 w-10 text-accent/30" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">Digital download</span>
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug flex-1">{product.title}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="font-display text-2xl font-semibold text-foreground">
            ₹{product.price_inr.toFixed(0)}
          </div>
          <Link href={`/products/${product.slug}`}>
            <Button variant="hero" size="sm">Buy now</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-narrow py-16 md:py-24">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs uppercase tracking-widest mb-4">
          <ShoppingBag className="h-3 w-3 text-accent" /> Digital Resources
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">Planning resources, made by trekkers</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Notion templates, PDF planners, training programs and packing systems — built for Himalayan trekking.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-border rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No products available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
