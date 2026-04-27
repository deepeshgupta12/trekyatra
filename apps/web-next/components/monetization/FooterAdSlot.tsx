interface Props {
  slotId?: string;
  className?: string;
}

export default function FooterAdSlot({ slotId, className = "" }: Props) {
  const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  if (!adSenseId) {
    return (
      <div className={`py-6 ${className}`}>
        <div className="flex items-center justify-center h-[60px] rounded-2xl bg-muted/30 border border-dashed border-border text-xs text-muted-foreground select-none container-wide">
          Ad slot — footer (970×60) · dev placeholder
        </div>
      </div>
    );
  }

  return (
    <div className={`py-6 ${className}`}>
      <div className="container-wide">
        <div
          className="adsbygoogle"
          style={{ display: "block", minHeight: "60px" }}
          data-ad-client={adSenseId}
          data-ad-slot={slotId ?? ""}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
