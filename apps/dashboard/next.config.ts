import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed basePath - dashboard runs on its own port (3002)
  // and doesn't need a path prefix
  serverExternalPackages: [],
};

export default nextConfig;
