import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // basePath required for multi-zone architecture with rewrites
  basePath: '/dashboard',
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Redirect root to basePath for direct domain access
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
