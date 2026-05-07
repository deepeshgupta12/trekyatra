import { Crown } from "lucide-react";

interface Props {
  size?: "sm" | "md";
  className?: string;
}

export default function PremiumBadge({ size = "sm", className = "" }: Props) {
  const base =
    size === "sm"
      ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold";
  return (
    <span className={`${base} bg-amber-400/15 text-amber-500 border border-amber-400/30 ${className}`}>
      <Crown className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      Premium
    </span>
  );
}
