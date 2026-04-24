import { RefreshCw } from "lucide-react";

interface Props {
  dateStr?: string | null;
  className?: string;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Recently updated";
  const date = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 30) return `Updated ${diffDays} days ago`;
  return `Updated ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function UpdatedBadge({ dateStr, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <RefreshCw className="h-3 w-3" />
      {formatDate(dateStr)}
    </span>
  );
}
