import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: 'http://localhost:3001/dashboard',
      },
      {
        source: '/dashboard/:path*',
        destination: 'http://localhost:3001/dashboard/:path*',
      },
      {
        source: '/agency',
        destination: 'http://localhost:3002/agency',
      },
      {
        source: '/agency/:path*',
        destination: 'http://localhost:3002/agency/:path*',
      },
      {
        source: '/entities',
        destination: 'http://localhost:3003/entities',
      },
      {
        source: '/entities/:path*',
        destination: 'http://localhost:3003/entities/:path*',
      },
      {
        source: '/payments',
        destination: 'http://localhost:3004/payments',
      },
      {
        source: '/payments/:path*',
        destination: 'http://localhost:3004/payments/:path*',
      },
      {
        source: '/reports',
        destination: 'http://localhost:3005/reports',
      },
      {
        source: '/reports/:path*',
        destination: 'http://localhost:3005/reports/:path*',
      },
    ]
  },
};

const sentryWebpackPluginOptions = {
  // Upload source maps during production build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
