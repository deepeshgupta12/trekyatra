"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, Trash2 } from "lucide-react";

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 mb-5">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="font-semibold">{title}</h2>
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
        <p className="text-sm font-medium">{label}</p>
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
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, notifications, and account.</p>
      </div>

      <SectionCard icon={User} title="Profile">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">First name</label>
            <input defaultValue="Deepesh" className="w-full h-10 px-3 rounded-xl border border-border bg-paper-grain focus:border-accent outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Last name</label>
            <input defaultValue="Gupta" className="w-full h-10 px-3 rounded-xl border border-border bg-paper-grain focus:border-accent outline-none text-sm" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
          <input defaultValue="guyshazam12@gmail.com" type="email" className="w-full h-10 px-3 rounded-xl border border-border bg-paper-grain focus:border-accent outline-none text-sm" />
        </div>
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mobile number</label>
          <input defaultValue="+91 ●●●●●●1234" type="tel" className="w-full h-10 px-3 rounded-xl border border-border bg-paper-grain focus:border-accent outline-none text-sm" />
        </div>
        <Button variant="hero" size="sm">Save profile</Button>
      </SectionCard>

      <SectionCard icon={Bell} title="Notifications">
        <Toggle label="Permit season alerts" sub="Get notified when permit bookings open for saved treks" defaultChecked />
        <Toggle label="New trek guides" sub="Weekly digest of newly published trek guides" defaultChecked />
        <Toggle label="Price drop alerts" sub="Notify when operator prices drop for saved treks" />
        <Toggle label="Newsletter" sub="Monthly editorial picks and tips" />
      </SectionCard>

      <SectionCard icon={Shield} title="Security">
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New password</label>
          <input type="password" placeholder="••••••••" className="w-full h-10 px-3 rounded-xl border border-border bg-paper-grain focus:border-accent outline-none text-sm" />
        </div>
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm new password</label>
          <input type="password" placeholder="••••••••" className="w-full h-10 px-3 rounded-xl border border-border bg-paper-grain focus:border-accent outline-none text-sm" />
        </div>
        <Button variant="outline" size="sm">Update password</Button>
      </SectionCard>

      <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="h-4 w-4 text-destructive" />
          <h2 className="font-semibold text-destructive">Danger zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all saved data. This cannot be undone.</p>
        <Button variant="destructive" size="sm">Delete account</Button>
      </div>
    </div>
  );
}
