interface Props {
  slotId?: string;
  className?: string;
}

export default function InArticleAdSlot({ slotId, className = "" }: Props) {
  const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  if (!adSenseId) {
    return (
      <div className={`my-8 ${className}`}>
        <div className="flex items-center justify-center h-[90px] rounded-2xl bg-muted/30 border border-dashed border-border text-xs text-muted-foreground select-none">
          Ad slot — in-article (728×90) · dev placeholder
        </div>
      </div>
    );
  }

  return (
    <div className={`my-8 ${className}`}>
      <div
        className="adsbygoogle"
        style={{ display: "block", minHeight: "90px" }}
        data-ad-client={adSenseId}
        data-ad-slot={slotId ?? ""}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
