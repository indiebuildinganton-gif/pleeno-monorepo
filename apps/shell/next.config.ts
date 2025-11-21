import type { NextConfig } from "next";
// import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === 'development';

const ZONE_URLS = {
  reports: isDev
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_REPORTS_URL || 'https://app.pleeno.com',
  entities: isDev
    ? 'http://localhost:3001'
    : process.env.NEXT_PUBLIC_ENTITIES_URL || 'https://app.pleeno.com',
  dashboard: isDev
    ? 'http://localhost:3002'
    : process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://app.pleeno.com',
  payments: isDev
    ? 'http://localhost:3003'
    : process.env.NEXT_PUBLIC_PAYMENTS_URL || 'https://app.pleeno.com',
  agency: isDev
    ? 'http://localhost:3004'
    : process.env.NEXT_PUBLIC_AGENCY_URL || 'https://app.pleeno.com',
};

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  transpilePackages: ['@pleeno/database', '@pleeno/auth', '@pleeno/ui', '@pleeno/utils', '@pleeno/validations'],
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: `${ZONE_URLS.dashboard}/dashboard`,
      },
      {
        source: '/dashboard/:path*',
        destination: `${ZONE_URLS.dashboard}/dashboard/:path*`,
      },
      {
        source: '/agency',
        destination: `${ZONE_URLS.agency}/agency`,
      },
      {
        source: '/agency/:path*',
        destination: `${ZONE_URLS.agency}/agency/:path*`,
      },
      {
        source: '/entities',
        destination: `${ZONE_URLS.entities}/entities`,
      },
      {
        source: '/entities/:path*',
        destination: `${ZONE_URLS.entities}/entities/:path*`,
      },
      {
        source: '/payments',
        destination: `${ZONE_URLS.payments}/payments`,
      },
      {
        source: '/payments/:path*',
        destination: `${ZONE_URLS.payments}/payments/:path*`,
      },
      {
        source: '/reports',
        destination: `${ZONE_URLS.reports}/reports`,
      },
      {
        source: '/reports/:path*',
        destination: `${ZONE_URLS.reports}/reports/:path*`,
      },
    ];
  },
};

// Sentry temporarily disabled for builds
// const sentryWebpackPluginOptions = {
//   // Upload source maps during production build
//   silent: true,
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,
//   authToken: process.env.SENTRY_AUTH_TOKEN,
// };

export default nextConfig;
// export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
