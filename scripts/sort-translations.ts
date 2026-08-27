import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';

const LOCALES_DIR = 'public/locales';

runScript({
  command: 'pnpm translations:sort',
  title: 'Translation sorter',
  summary: `Rewrites every locale file with its keys in alphabetical order, so
two branches adding a translation touch the same part of the file.`,
  run: async () => {
    let sortedFiles = 0;

    for (const file of readdirSync(LOCALES_DIR)) {
      if (!file.endsWith('.json')) continue;

      const filePath = join(LOCALES_DIR, file);
      const data: Record<string, string> = JSON.parse(
        readFileSync(filePath, 'utf8'),
      );

      const sorted = Object.fromEntries(
        Object.keys(data)
          .sort()
          .map(key => [key, data[key]]),
      );

      writeFileSync(filePath, `${JSON.stringify(sorted, null, 2)}\n`);
      console.log(`  sorted ${filePath}`);
      sortedFiles++;
    }

    out.ok(`${sortedFiles} locale file(s) sorted.`);
  },
});
