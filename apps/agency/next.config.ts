import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // basePath removed for subdomain deployment (agency.plenno.com.au)
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
