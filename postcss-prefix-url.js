/**
 * PostCSS plugin that rewrites root-relative url() references to include the
 * deployment base path.
 *
 * Without this, CSS like `url(/website/images/icon.svg)` breaks when the app
 * is served under a subpath (e.g. /portal) because Next.js does not rewrite
 * url() in CSS the way it does for <Link>, router.push, or next/image.
 *
 * Usage: pass {prefix: '/your-base-path'} — no-op when prefix is empty.
 */
const plugin = (opts = {}) => {
  const prefix = opts.prefix || '';
  return {
    postcssPlugin: 'postcss-prefix-url',
    Declaration(decl) {
      if (!prefix || !decl.value.includes('url(')) return;
      // Capture: url( + optional quote + path (starting with /)
      // Path is everything up to the next quote, space, or closing paren.
      // Skips already-prefixed paths, protocol-relative (//), and fragments (#).
      decl.value = decl.value.replace(
        /url\((['"]?)(\/[^'"\s)]*)/g,
        (match, quote, path) => {
          if (path.startsWith('//')) return match;
          if (path.startsWith(`${prefix}/`) || path === prefix) return match;
          return `url(${quote}${prefix}${path}`;
        },
      );
    },
  };
};
plugin.postcss = true;

module.exports = plugin;
