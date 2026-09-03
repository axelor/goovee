import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  // ...nextTs,
  prettier,
  {
    rules: {
      'react-compiler/react-compiler': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/cache',
              importNames: ['revalidatePath'],
              message:
                'revalidatePath matches the route-tree path, which always carries the tenant segment — fed the visitor-shaped workspaceURI it silently revalidates nothing on a host-routed tenant. Use access.url.revalidate(sub) inside an action, tenantURLs(id).workspace(slug).revalidate(sub) outside one, or revalidateEverything from @/lib/core/url/revalidate.',
            },
            {
              name: '@/lib/core/path/base-path',
              importNames: ['getBasePath'],
              message:
                'Hand-joining the base path is how it ends up missing or doubled. Use withBasePath for a path, absoluteRoot from @/lib/core/url/absolute for an origin joined to the base path.',
            },
          ],
        },
      ],
    },
  },
  /* The named file holds the join everything else is sent through. Scoped to
   * the one rule it needs lifted, so a file exempted for the base path does not
   * also lose the `revalidatePath` restriction. */
  {
    files: ['lib/core/url/absolute.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/cache',
              importNames: ['revalidatePath'],
              message:
                'revalidatePath matches the route-tree path, which always carries the tenant segment — fed the visitor-shaped workspaceURI it silently revalidates nothing on a host-routed tenant. Use access.url.revalidate(sub) inside an action, tenantURLs(id).workspace(slug).revalidate(sub) outside one, or revalidateEverything from @/lib/core/url/revalidate.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Copied verbatim from the installed PDF reader, not ours to change.
    'public/pdfjs/**',
  ]),
]);

export default eslintConfig;
