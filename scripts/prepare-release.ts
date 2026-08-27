import fs from 'node:fs';
import path from 'node:path';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';
import {run} from '@/scripts/lib/shell';

import {version} from '../package.json';

const UNRELEASED_DIR = path.join(__dirname, '..', 'changelogs', 'unreleased');

/* What a release is made of. A release with none has nothing to say for
 * itself, and the commit below would fail with nothing staged — so it is
 * refused here, where the reason can be given. */
function unreleasedEntries(): string[] {
  if (!fs.existsSync(UNRELEASED_DIR)) return [];

  return fs.readdirSync(UNRELEASED_DIR).filter(file => file.endsWith('.json'));
}

runScript({
  command: 'pnpm release:prepare',
  title: 'Release preparation',
  summary: `Turns the unreleased changelog entries into CHANGELOG.md and
RELEASE_NOTES.md and commits them as the release the version in package.json
names.

The commit takes whatever else is already staged with it, which is how an edit
made for this release — a compatibility table, a version note — rides along.
Stage such an edit before running this, and stage nothing else.`,
  run: async () => {
    const entries = unreleasedEntries();

    if (entries.length === 0) {
      out.fail(
        `Nothing to release: no unreleased changelog entries. A change that needs no note — a tooling or development-only change — does not get a release of its own.`,
      );
    }

    out.note(
      `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} to release as v${version}.`,
    );

    run('pnpm changelogs:validate');
    run('pnpm changelogs:generate');
    run('pnpm format');

    run('git add CHANGELOG.md RELEASE_NOTES.md changelogs/unreleased');
    run(`git commit -m "chore(release): v${version}"`);

    out.ok(`Prepared v${version}. Ready to push.`);
  },
});
