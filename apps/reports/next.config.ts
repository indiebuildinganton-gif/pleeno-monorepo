import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
