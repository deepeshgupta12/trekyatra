"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Pencil, Trash2, CheckCircle, XCircle, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchOperators, createOperator, patchOperator, deleteOperator, Operator } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const BLANK_FORM = {
  name: "", slug: "", contact_email: "", phone: "", website_url: "",
  region: "", trek_types: "", active: true,
};

type FormState = typeof BLANK_FORM;

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOperators(await fetchOperators());
    } catch {
      setError("Failed to load operators.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditId(null);
    setForm(BLANK_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(op: Operator) {
    setEditId(op.id);
    setForm({
      name: op.name,
      slug: op.slug,
      contact_email: op.contact_email,
      phone: op.phone ?? "",
      website_url: op.website_url ?? "",
      region: (op.region ?? []).join(", "),
      trek_types: (op.trek_types ?? []).join(", "),
      active: op.active,
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(BLANK_FORM);
    setFormError("");
  }

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !editId) next.slug = slugify(value as string);
      return next;
    });
  }

  function parseList(s: string): string[] {
    return s.split(",").map(x => x.trim()).filter(Boolean);
  }

  async function handleSave() {
    setFormError("");
    if (!form.name.trim() || !form.contact_email.trim() || !form.slug.trim()) {
      setFormError("Name, slug and email are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        contact_email: form.contact_email.trim(),
        phone: form.phone.trim() || undefined,
        website_url: form.website_url.trim() || undefined,
        region: parseList(form.region).length ? parseList(form.region) : undefined,
        trek_types: parseList(form.trek_types).length ? parseList(form.trek_types) : undefined,
        active: form.active,
      };

      if (editId) {
        await patchOperator(editId, payload);
      } else {
        await createOperator(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this operator? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await deleteOperator(id);
      setOperators(prev => prev.filter(o => o.id !== id));
    } catch {
      setError("Delete failed.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(op: Operator) {
    try {
      const updated = await patchOperator(op.id, { active: !op.active });
      setOperators(prev => prev.map(o => o.id === updated.id ? updated : o));
    } catch {
      setError("Failed to update operator.");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Operators</h1>
          <p className="text-white/50 text-sm">Trek operators for lead routing and referrals.</p>
        </div>
        <Button variant="hero" size="sm" className="w-fit" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add Operator
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-6">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">{editId ? "Edit Operator" : "New Operator"}</h2>
            <button onClick={closeForm} className="text-white/40 hover:text-white/80">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ["name", "Name *"],
              ["slug", "Slug *"],
              ["contact_email", "Contact Email *"],
              ["phone", "Phone"],
              ["website_url", "Website URL"],
              ["region", "Regions (comma-sep)"],
              ["trek_types", "Trek types (comma-sep)"],
            ] as [keyof FormState, string][]).map(([field, label]) => (
              <div key={field}>
                <label className="text-xs text-white/40 mb-1 block">{label}</label>
                <input
                  type="text"
                  value={form[field] as string}
                  onChange={e => handleChange(field, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                />
              </div>
            ))}

            <div className="flex items-center gap-3">
              <label className="text-xs text-white/40">Active</label>
              <button
                type="button"
                onClick={() => handleChange("active", !form.active)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  form.active
                    ? "text-pine bg-pine/10 border-pine/20"
                    : "text-white/40 bg-white/5 border-white/10"
                }`}
              >
                {form.active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          {formError && <p className="text-red-400 text-xs mt-3">{formError}</p>}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white" onClick={closeForm}>
              Cancel
            </Button>
            <Button variant="hero" size="sm" disabled={saving} onClick={handleSave}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {editId ? "Save changes" : "Create operator"}
            </Button>
          </div>
        </div>
      )}

      {/* Operators table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">
            {loading ? "Loading…" : `${operators.length} operator${operators.length !== 1 ? "s" : ""}`}
          </h2>
          <Building2 className="h-4 w-4 text-white/30" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/40">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
          </div>
        ) : operators.length === 0 ? (
          <p className="text-white/40 text-sm p-6">No operators yet. Add one to start routing leads.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Name</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Treks covered</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Added</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.map(op => (
                  <tr key={op.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-white/80 font-medium text-xs sm:text-sm">{op.name}</p>
                      <p className="text-white/40 text-[11px]">{op.contact_email}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(op.trek_types ?? []).slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent/80 border border-accent/20">{t}</span>
                        ))}
                        {(op.trek_types ?? []).length > 3 && (
                          <span className="text-[10px] text-white/30">+{(op.trek_types ?? []).length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden md:table-cell">{formatDate(op.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleActive(op)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                          op.active
                            ? "text-pine bg-pine/10 border-pine/20 hover:bg-pine/20"
                            : "text-white/40 bg-white/5 border-white/10 hover:bg-white/8"
                        }`}
                      >
                        {op.active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {op.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(op)}
                          className="text-white/40 hover:text-white/80 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(op.id)}
                          disabled={deleting === op.id}
                          className="text-white/40 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          {deleting === op.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
