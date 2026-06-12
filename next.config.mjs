import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['reaviz'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      reaviz: path.join(__dirname, 'node_modules', 'reaviz', 'dist', 'index.js'),
    };
    return config;
  },
}

export default withNextIntl(nextConfig)
