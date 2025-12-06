import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // basePath removed for subdomain deployment (dashboard.plenno.com.au)
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
