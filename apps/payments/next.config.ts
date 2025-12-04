import type { NextConfig } from "next";

// Only use basePath in production or when running through the shell app
// In standalone dev mode (port 3003), allow access at root
const nextConfig: NextConfig = {
  basePath: process.env.STANDALONE_MODE ? undefined : '/payments',
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
