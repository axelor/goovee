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
                'revalidatePath matches the route-tree path, which always carries the tenant segment — fed the visitor-shaped workspaceURI it silently revalidates nothing on a host-routed tenant. Use revalidateWorkspacePath or revalidateEverything from @/lib/core/url/revalidate.',
            },
            {
              name: '@/lib/core/path/base-path',
              importNames: ['getBasePath'],
              message:
                'Hand-joining the base path is how it ends up missing or doubled. Use withBasePath for a path, getPortalRoot from @/utils/workspace-url for host + base path.',
            },
          ],
        },
      ],
    },
  },
  /* The named files hold the joins everything else is sent through. */
  {
    files: [
      'utils/workspace-url.ts',
      'app/api/auth/**/route.ts',
      'scripts/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
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
