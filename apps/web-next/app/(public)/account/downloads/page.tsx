"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadResponse, fetchDownloads } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function guessIcon(filename: string) {
  if (filename.toLowerCase().endsWith(".gpx") || filename.toLowerCase().includes("map")) {
    return <Map className="h-5 w-5 text-accent" />;
  }
  return <FileText className="h-5 w-5 text-accent" />;
}

export default function Downloads() {
  const [downloads, setDownloads] = useState<DownloadResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDownloads()
      .then(setDownloads)
      .catch(() => setDownloads([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Downloads</h1>
        <p className="text-muted-foreground">Guides, checklists, and trail maps you&apos;ve unlocked.</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm py-16 text-center">Loading your downloads…</div>
      ) : downloads.length === 0 ? (
        <div className="text-center py-20">
          <Download className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No downloads yet. Unlock resources from trek detail pages.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((item) => (
            <div
              key={item.id}
              className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                {guessIcon(item.filename)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {item.product_id && `${item.product_id} · `}Downloaded {formatDate(item.downloaded_at)}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
