/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@react-oauth/google"],
  experimental: {
    proxyTimeout: 120_000, // 2 minutes — LLM-backed endpoints can take 30-60s
  },
  async rewrites() {
    // INTERNAL_API_URL: where Next.js server proxies /api/* requests to.
    // Must point to the FastAPI backend directly (api.trekyatra.co.in in prod),
    // NOT to www.trekyatra.co.in — that would create an infinite loop.
    // NEXT_PUBLIC_API_BASE is for client-side fetch calls and must NOT be used here.
    const internalApiBase =
      process.env.INTERNAL_API_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiBase}/api/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
