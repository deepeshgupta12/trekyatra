import { Download, FileText, Map, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DOWNLOADS = [
  { name: "Kedarkantha Trek — Packing Checklist", type: "PDF", size: "180 KB", date: "Jan 12", unlocked: true },
  { name: "Himachal Pradesh Permit Guide 2025", type: "PDF", size: "240 KB", date: "Jan 8", unlocked: true },
  { name: "Uttarakhand Offline Trail Map", type: "GPX", size: "1.2 MB", date: "Dec 29", unlocked: true },
  { name: "Valley of Flowers Detailed Itinerary", type: "PDF", size: "320 KB", date: "—", unlocked: false },
];

export default function Downloads() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Downloads</h1>
        <p className="text-muted-foreground">Guides, checklists, and trail maps you&apos;ve unlocked.</p>
      </div>

      {DOWNLOADS.length === 0 ? (
        <div className="text-center py-20">
          <Download className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No downloads yet. Unlock resources from trek detail pages.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {DOWNLOADS.map(item => (
            <div key={item.name} className={`bg-surface rounded-2xl border p-5 flex items-center gap-4 ${item.unlocked ? "border-border" : "border-border/50 opacity-60"}`}>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                {item.type === "GPX" ? <Map className="h-5 w-5 text-accent" /> : <FileText className="h-5 w-5 text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.type} · {item.size} {item.date !== "—" && `· Downloaded ${item.date}`}</p>
              </div>
              {item.unlocked ? (
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> Download</Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/products"><Lock className="h-3.5 w-3.5" /> Unlock</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
