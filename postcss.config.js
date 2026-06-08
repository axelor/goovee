function normalizeBasePath(value) {
  const raw = value?.trim();
  if (!raw || raw === '/') return '';
  const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
  return prefixed.replace(/\/+$/, '');
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    ...(basePath ? [require('./postcss-prefix-url')({prefix: basePath})] : []),
  ],
};
