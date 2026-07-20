import createNextIntlPlugin from 'next-intl/plugin';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow Server Actions (used by WorkOS AuthKit's useAccessToken) to work
  // behind the preview/ingress reverse proxy. The browser Origin is the internal
  // cluster domain (*.emergentcf.cloud) while x-forwarded-host is the public
  // domain (*.emergentagent.com); both must be allow-listed.
  // `**` is Next.js' recursive wildcard (matches any subdomain depth) — required
  // because the browser Origin behind the ingress is a multi-label cluster host
  // (e.g. finance-bilan.cluster-5.preview.emergentcf.cloud) while x-forwarded-host
  // is the public domain (*.preview.emergentagent.com).
  allowedDevOrigins: [
    "**.emergentagent.com",
    "**.emergentcf.cloud",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "**.emergentagent.com",
        "**.emergentcf.cloud",
        "localhost:3000",
      ],
    },
  },
  images: {
    unoptimized: true,
  },
  // reaviz ships ESM-only via the `exports` field and isn't picked up
  // correctly during Next 15 production builds unless we transpile it
  // (along with its peer deps).
  transpilePackages: [
    "reaviz",
    "rdk",
    "realayers",
    "transformation-matrix",
    "@react-spring/web",
    "@react-spring/animated",
    "@react-spring/core",
  ],
  webpack: (config) => {
    // Force webpack to resolve `reaviz` to its actual ESM entry, bypassing
    // the strict `exports` field that fails Next 15 production builds.
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      reaviz$: require("path").resolve("./node_modules/reaviz/dist/index.js"),
    }
    return config
  },
}

export default withNextIntl(nextConfig)
