import Link from "next/link";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

// Circular mountain-badge icon matching new TrekYatra brand identity
// To use the actual logo PNG: place it at /public/images/logo.png
// and replace <LogoMark /> with <Image src="/images/logo.png" ... />
function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <clipPath id="circ">
          <circle cx="20" cy="20" r="19" />
        </clipPath>
      </defs>
      {/* Circular background */}
      <circle cx="20" cy="20" r="19" fill="url(#skyGrad)" />
      <g clipPath="url(#circ)">
        {/* Far mountain */}
        <polygon points="4,33 13,15 22,33" fill="rgba(255,255,255,0.25)" />
        {/* Near mountain */}
        <polygon points="12,33 22,11 32,33" fill="white" />
        {/* Snow cap */}
        <polygon points="19,18 22,11 25,18" fill="rgba(255,255,255,0.65)" />
        {/* Forest base */}
        <rect x="0" y="28" width="40" height="12" fill="#15803d" />
        {/* Sun glow */}
        <circle cx="30" cy="12" r="3.5" fill="rgba(255,255,255,0.85)" />
        {/* Trekker silhouette */}
        <rect x="17" y="24" width="1.5" height="5" fill="rgba(0,0,0,0.45)" rx="0.5" />
        <circle cx="17.75" cy="23" r="1.2" fill="rgba(0,0,0,0.45)" />
      </g>
      {/* Ring border */}
      <circle cx="20" cy="20" r="19" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" />
    </svg>
  );
}

export const Logo = ({ variant = "dark", className = "" }: LogoProps) => {
  const isLight = variant === "light";
  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <LogoMark size={38} />
      </div>
      <div className="leading-none whitespace-nowrap">
        <div
          className={`font-display text-[20px] font-bold tracking-tight leading-none ${
            isLight ? "text-white" : "text-foreground"
          }`}
        >
          Trek
          <span className={isLight ? "text-orange-400" : "text-orange-500"}>
            Yatra
          </span>
        </div>
        <div
          className={`text-[9px] uppercase tracking-[0.22em] font-medium mt-0.5 hidden sm:block ${
            isLight ? "text-white/55" : "text-muted-foreground/70"
          }`}
        >
          Explore · Experience · Escape
        </div>
      </div>
    </Link>
  );
};
