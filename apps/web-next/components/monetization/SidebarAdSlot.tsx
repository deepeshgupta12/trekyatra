interface Props {
  slotId?: string;
  className?: string;
}

export default function SidebarAdSlot({ slotId, className = "" }: Props) {
  const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  if (!adSenseId) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-[250px] w-full rounded-2xl bg-muted/30 border border-dashed border-border text-xs text-muted-foreground select-none">
          Ad slot — sidebar (300×250) · dev placeholder
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className="adsbygoogle"
        style={{ display: "block", minHeight: "250px" }}
        data-ad-client={adSenseId}
        data-ad-slot={slotId ?? ""}
        data-ad-format="rectangle"
      />
    </div>
  );
}
