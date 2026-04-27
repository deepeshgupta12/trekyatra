import { CalendarDays, UserCheck, ShieldCheck } from "lucide-react";

interface Props {
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string;
  factChecked?: boolean;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TrustSignals({ publishedAt, updatedAt, authorName = "TrekYatra Editorial", factChecked = true }: Props) {
  const dateStr = updatedAt ?? publishedAt;
  return (
    <div className="not-prose flex flex-wrap items-center gap-4 py-3 px-4 bg-muted/30 border border-border rounded-2xl text-xs text-muted-foreground my-6">
      {dateStr && (
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          {updatedAt ? `Updated ${formatDate(updatedAt)}` : `Published ${formatDate(dateStr)}`}
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <UserCheck className="h-3.5 w-3.5 text-accent flex-shrink-0" />
        {authorName}
      </span>
      {factChecked && (
        <span className="flex items-center gap-1.5 text-success">
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
          Fact-checked
        </span>
      )}
    </div>
  );
}
