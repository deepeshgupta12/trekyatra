"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DigitalProduct,
  ProductCreate,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "@/lib/api";

const EMPTY: ProductCreate = {
  slug: "",
  title: "",
  description: "",
  price_inr: 0,
  file_path: "",
  preview_image_url: "",
  active: true,
};

function ProductForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ProductCreate;
  onSave: (data: ProductCreate) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ProductCreate>(initial);
  const set = (k: keyof ProductCreate, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
      <h2 className="font-semibold text-white text-sm mb-4">
        {initial.slug ? "Edit product" : "Add product"}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40">Slug *</label>
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="himalayan-packing-guide"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40">Title *</label>
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Himalayan Packing Guide"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs text-white/40">Description</label>
          <textarea
            rows={2}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 resize-none"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description shown on product page"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40">Price (₹) *</label>
          <input
            type="number"
            min={0}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50"
            value={form.price_inr}
            onChange={(e) => set("price_inr", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40">File path (relative to data/products/)</label>
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50"
            value={form.file_path ?? ""}
            onChange={(e) => set("file_path", e.target.value)}
            placeholder="himalayan-packing-guide.pdf"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs text-white/40">Preview image URL</label>
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50"
            value={form.preview_image_url ?? ""}
            onChange={(e) => set("preview_image_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="active-toggle"
            type="checkbox"
            checked={!!form.active}
            onChange={(e) => set("active", e.target.checked)}
            className="accent-accent"
          />
          <label htmlFor="active-toggle" className="text-sm text-white/70">
            Active (visible in public product list)
          </label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="hero" size="sm" onClick={() => onSave(form)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
        <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DigitalProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSave(data: ProductCreate) {
    setSaving(true);
    try {
      if (editing) {
        await updateAdminProduct(editing.id, data);
        flash("Product updated.");
      } else {
        await createAdminProduct(data);
        flash("Product created.");
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch {
      flash("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await deleteAdminProduct(id);
      flash("Product deleted.");
      await load();
    } catch {
      flash("Delete failed.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Products</h1>
          <p className="text-white/50 text-sm">Manage digital products for sale.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button
            variant="hero"
            size="sm"
            className="w-fit"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add product
          </Button>
          {message && <p className="text-xs text-accent">{message}</p>}
        </div>
      </div>

      {(showForm && !editing) && (
        <ProductForm
          initial={EMPTY}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No products yet. Add your first product above.</p>
        </div>
      ) : (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Product</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Price</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Sales</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="px-4 py-3 text-white/40 font-medium text-xs text-right hidden md:table-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <>
                    {editing?.id === p.id && (
                      <tr key={`edit-${p.id}`}>
                        <td colSpan={6} className="px-4 py-3">
                          <ProductForm
                            initial={{
                              slug: p.slug,
                              title: p.title,
                              description: p.description ?? "",
                              price_inr: p.price_inr,
                              file_path: p.file_path ?? "",
                              preview_image_url: p.preview_image_url ?? "",
                              active: p.active,
                            }}
                            onSave={handleSave}
                            onCancel={() => setEditing(null)}
                            saving={saving}
                          />
                        </td>
                      </tr>
                    )}
                    <tr
                      key={p.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-white/80 font-medium text-xs sm:text-sm max-w-[180px] truncate">
                        {p.title}
                      </td>
                      <td className="px-4 py-3.5 text-white/40 text-xs hidden sm:table-cell font-mono">
                        {p.slug}
                      </td>
                      <td className="px-4 py-3.5 text-white/80 text-xs sm:text-sm">
                        ₹{p.price_inr.toFixed(0)}
                      </td>
                      <td className="px-4 py-3.5 text-white/40 text-xs hidden md:table-cell">
                        {p.sales_count ?? 0}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            p.active
                              ? "text-pine bg-pine/10 border-pine/20"
                              : "text-white/40 bg-white/5 border-white/10"
                          }`}
                        >
                          {p.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden md:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditing(p); setShowForm(false); }}
                            className="text-white/30 hover:text-white/80 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            className="text-white/30 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            {deleting === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
