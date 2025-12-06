import type { NextConfig } from "next";

// basePath removed for subdomain deployment (payments.plenno.com.au)
const nextConfig: NextConfig = {
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
