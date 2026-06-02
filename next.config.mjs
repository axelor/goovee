function normalizeBasePath(value) {
  const raw = value?.trim();
  if (!raw || raw === '/') return '';
  const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
  return prefixed.replace(/\/+$/, '');
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    taint: true,
    serverActions: {
      bodySizeLimit: '25mb',
    },
    proxyClientMaxBodySize: '25mb',
  },
  reactStrictMode: false,
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  basePath,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/javascript; charset=utf-8',
        },
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
        {
          key: 'Content-Security-Policy',
          /*
           * Service workers need broad connect-src to fetch and cache external
           * resources (images, fonts, etc.) intercepted by serwist defaultCache.
           * 'self' covers http://localhost in dev; https: covers all external CDNs.
           */
          value:
            "default-src 'self'; script-src 'self'; connect-src 'self' https:",
        },
      ],
    },
  ],
};

export default nextConfig;
