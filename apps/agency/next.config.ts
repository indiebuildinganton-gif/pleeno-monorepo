import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/agency',
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
