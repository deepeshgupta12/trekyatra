import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
  /** Pass compact to hide the tagline — use in space-constrained headers */
  compact?: boolean;
  /** Controls logo image + text size. md = default (48px), lg = footer (56px) */
  size?: "md" | "lg";
}

// PNG logo is at /public/images/Logo_Trekyatra.png — used directly below.
// SVG fallback retained for use in non-image contexts if needed.
function LogoMark({ size = 42 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <clipPath id="badge">
          <circle cx="22" cy="22" r="20" />
        </clipPath>
      </defs>
      {/* Navy outer ring */}
      <circle cx="22" cy="22" r="21.5" fill="#1e2d4e" />
      {/* Sky */}
      <circle cx="22" cy="22" r="20" fill="url(#sky)" />
      <g clipPath="url(#badge)">
        {/* Back mountains */}
        <polygon points="4,38 14,18 24,38" fill="#5b7fa6" opacity="0.65" />
        <polygon points="20,38 30,14 40,38" fill="#3d5a7a" opacity="0.75" />
        {/* Main peak */}
        <polygon points="10,38 22,10 34,38" fill="#4a6fa0" />
        {/* Snow */}
        <polygon points="19,17 22,10 25,17" fill="white" opacity="0.9" />
        {/* Forest */}
        <rect x="0" y="29" width="44" height="15" fill="#15803d" />
        {/* Pine trees */}
        <polygon points="4,29 7.5,19 11,29" fill="#166534" />
        <polygon points="33,29 36.5,19 40,29" fill="#166534" />
        {/* Sun */}
        <circle cx="34" cy="11" r="4.5" fill="#fde68a" opacity="0.95" />
        {/* Birds */}
        <path d="M28 8 Q29 7 30 8" stroke="#1e2d4e" strokeWidth="0.7" fill="none" />
        <path d="M31 6.5 Q32 5.5 33 6.5" stroke="#1e2d4e" strokeWidth="0.7" fill="none" />
        {/* Trekker */}
        <circle cx="18.5" cy="26.5" r="1.6" fill="#1e2d4e" />
        <rect x="17.7" y="28" width="1.6" height="4.5" fill="#1e2d4e" rx="0.5" />
        <line x1="19.5" y1="29" x2="21.5" y2="33.5" stroke="#1e2d4e" strokeWidth="0.9" />
      </g>
      {/* Inner border ring */}
      <circle cx="22" cy="22" r="20" stroke="#1e2d4e" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export const Logo = ({ variant = "dark", className = "", compact = false, size = "md" }: LogoProps) => {
  const isLight = variant === "light";
  const isLarge = size === "lg";
  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      {/* Actual brand logo PNG */}
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-orange-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Image
          src="/images/Logo_Trekyatra.png"
          alt="TrekYatra logo"
          width={isLarge ? 56 : 48}
          height={isLarge ? 56 : 48}
          className={`${isLarge ? "w-14 h-14" : "w-12 h-12"} object-contain relative`}
        />
      </div>
      <div className="leading-none whitespace-nowrap">
        <div
          className={`font-display font-bold tracking-tight leading-none ${
            isLarge ? "text-[25px]" : "text-[22px]"
          } ${
            isLight ? "!text-white drop-shadow-sm" : "text-[#1e2d4e]"
          }`}
        >
          Trek<span className={isLight ? "text-orange-300" : "text-orange-500"}>yatra</span>
        </div>
        {!compact && (
          <div
            className={`text-[8px] uppercase tracking-[0.22em] font-semibold mt-0.5 hidden sm:block ${
              isLight ? "!text-white/60" : "text-[#166534]/80"
            }`}
          >
            Explore. Dream. Discover.
          </div>
        )}
      </div>
    </Link>
  );
};
