/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@react-oauth/google"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
