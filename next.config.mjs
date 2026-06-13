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
