import Link from "next/link";
import { Mountain } from "lucide-react";

export const Logo = ({ variant = "dark", className = "" }: { variant?: "dark" | "light"; className?: string }) => {
  const color = variant === "light" ? "text-surface" : "text-primary";
  const accent = variant === "light" ? "text-accent-glow" : "text-accent";
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-accent/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-saffron shadow-md-soft">
          <Mountain className="h-5 w-5 text-accent-foreground" strokeWidth={2.5} />
        </div>
      </div>
      <div className="leading-none whitespace-nowrap">
        <div className={`font-display text-xl font-bold tracking-tight ${color}`}>
          Trek<span className={accent}>Yatra</span>
        </div>
        <div className={`text-[10px] uppercase tracking-[0.2em] ${variant === "light" ? "text-surface/60" : "text-muted-foreground"} hidden sm:block`}>
          India · Trails · Trust
        </div>
      </div>
    </Link>
  );
};
