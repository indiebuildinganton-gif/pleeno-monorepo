import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // basePath required for multi-zone architecture with rewrites
  basePath: '/reports',
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
