import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/entities',
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
