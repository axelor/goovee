// @ts-check
// If you want to use the fully resolved Next.js
// configuration to resolve Serwist configuration,
// use `serwist.withNextConfig` instead.

// const {spawnSync} = require('node:child_process');
// const crypto = require('node:crypto');
const {serwist} = require('@serwist/next/config');

// This is optional!
// A revision helps Serwist version a precached page. This
// avoids outdated precached responses being used. Using
// `git rev-parse HEAD` might not be the most efficient way
// of determining a revision, however. You may prefer to use
// the hashes of every extra file you precache.
// const revision =
//   spawnSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf-8'}).stdout?.trim() ??
//   crypto.randomUUID();

module.exports = serwist.withNextConfig(nextConfig => ({
  swSrc: 'lib/core/pwa/sw.ts',
  swDest: 'public/sw.js',

  // If you want to precache any other page that is not
  // already detected by Serwist, add them here. Otherwise,
  // delete `revision`.
  // additionalPrecacheEntries: [{url: '/precached', revision}],

  maximumFileSizeToCacheInBytes: 2.5 * 1024 * 1024, // 2.5 MB

  globIgnores: [
    `${nextConfig.distDir}/server/pages/**/*.json`,
    `${nextConfig.distDir}/server/app/ignored.html`,
  ],
}));
