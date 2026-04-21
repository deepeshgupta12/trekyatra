"use client";

import { useAuth } from "@/lib/auth-context";

export function UserGreeting() {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return (
    <p className="text-muted-foreground mb-8">Your saved treks and planning workspace.</p>
  );
  const name = user.display_name || user.full_name || user.email || "there";
  return (
    <p className="text-muted-foreground mb-8">
      Welcome back, <span className="text-foreground font-medium">{name}</span>. Your saved treks and planning workspace.
    </p>
  );
}
