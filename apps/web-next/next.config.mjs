/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@react-oauth/google"],
  experimental: {
    proxyTimeout: 120_000, // 2 minutes — LLM-backed endpoints can take 30-60s
  },
  async rewrites() {
    // In production (DO App Platform), proxy to the public API domain.
    // In local dev, proxy to localhost:8000.
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
