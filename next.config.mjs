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
  /*
   * Images are addressed by our own loader and served by the routes that already
   * hold them, so access is checked on every request. Naming a loader also turns
   * off the framework's optimisation endpoint, whose cache is keyed on the
   * address and size alone and is therefore shared across users.
   */
  images: {
    loader: 'custom',
    loaderFile: './lib/core/image/loader.ts',
  },
  /*
   * The imaging library loads its shared library at run time rather than
   * importing it, so the standalone build has no way to see that it is needed
   * and leaves it behind. Without it the server starts and only fails when it
   * first resizes an image, so it is named here explicitly.
   */
  outputFileTracingIncludes: {
    '**': [
      './node_modules/.pnpm/@img+sharp-libvips-linux*/node_modules/@img/*/lib/*.so*',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    taint: true,
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: '25mb',
    },
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
