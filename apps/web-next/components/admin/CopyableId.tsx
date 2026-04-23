"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyableId({ id, label }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const short = `${id.slice(0, 8)}…`;

  return (
    <button
      onClick={copy}
      title={id}
      className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors group"
    >
      <span className="font-mono text-[10px]">{label ? `${label}: ${short}` : short}</span>
      {copied
        ? <Check className="h-3 w-3 text-pine flex-shrink-0" />
        : <Copy className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
}
