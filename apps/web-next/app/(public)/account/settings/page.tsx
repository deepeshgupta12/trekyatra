"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, Trash2, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const inputCls = "w-full h-10 px-3 rounded-xl border border-border bg-background focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm text-foreground";

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-5">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, sub, defaultChecked }: { label: string; sub: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-accent" : "bg-border"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export default function AccountSettings() {
  const { user, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setDisplayName(user.display_name ?? "");
    }
  }, [user]);

  async function saveProfile() {
    setSaving(true);
    setProfileError("");
    setSaved(false);
    try {
      const res = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, display_name: displayName }),
      });
      if (!res.ok) throw new Error("Save failed");
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setProfileError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword() {
    if (newPassword !== confirmPassword) {
      setPwMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg("Password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    setPwMsg("");
    try {
      // Use forgot-password → reset flow: send a reset link to their email
      if (!user?.email) { setPwMsg("No email on account."); return; }
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        setPwMsg("A password reset link has been sent to your email.");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPwMsg("Failed. Please try again.");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, notifications, and account.</p>
      </div>

      <SectionCard icon={User} title="Profile">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputCls}
              placeholder="How you appear to others"
            />
          </div>
        </div>
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
          <input
            value={user?.email ?? ""}
            disabled
            className={`${inputCls} opacity-50 cursor-not-allowed`}
          />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
        </div>
        {profileError && <p className="text-sm text-destructive mb-3">{profileError}</p>}
        <div className="flex items-center gap-3">
          <Button variant="hero" size="sm" onClick={saveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-success">
              <CheckCircle className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard icon={Bell} title="Notifications">
        <Toggle label="Permit season alerts" sub="Get notified when permit bookings open for saved treks" defaultChecked />
        <Toggle label="New trek guides" sub="Weekly digest of newly published trek guides" defaultChecked />
        <Toggle label="Price drop alerts" sub="Notify when operator prices drop for saved treks" />
        <Toggle label="Newsletter" sub="Monthly editorial picks and tips" />
        <p className="text-xs text-muted-foreground mt-3">Notification preferences are saved locally. Email delivery requires SMTP to be configured.</p>
      </SectionCard>

      <SectionCard icon={Shield} title="Password">
        <p className="text-sm text-muted-foreground mb-4">To change your password, we&apos;ll send a reset link to your email.</p>
        <Button variant="outline" size="sm" onClick={updatePassword} disabled={pwSaving}>
          {pwSaving ? "Sending…" : "Send password reset link"}
        </Button>
        {pwMsg && <p className="text-sm text-muted-foreground mt-3">{pwMsg}</p>}
      </SectionCard>

      <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="h-4 w-4 text-destructive" />
          <h2 className="font-semibold text-destructive">Danger zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">To delete your account, contact us at explore@trekyatra.co.in. This cannot be undone.</p>
        <a href="mailto:explore@trekyatra.co.in">
          <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/5">Contact support</Button>
        </a>
      </div>
    </div>
  );
}
