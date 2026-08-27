import fs from 'node:fs';
import path from 'node:path';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';
import {run} from '@/scripts/lib/shell';
import {Argument} from 'commander';

const PACKAGE_FILE = path.join(__dirname, '..', 'package.json');

const PARTS = ['major', 'minor', 'patch'] as const;

type Part = (typeof PARTS)[number];

/* Everything the file holds, so rewriting the version keeps the rest. */
type PackageFile = Record<string, unknown> & {version: string};

function readPackage(): PackageFile {
  const raw: unknown = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    out.fail(`${PACKAGE_FILE} does not hold a JSON object.`);
  }

  const fields: Record<string, unknown> = {...raw};

  if (typeof fields.version !== 'string') {
    out.fail(`${PACKAGE_FILE} has no string 'version' to raise.`);
  }

  return {...fields, version: fields.version};
}

function raise(version: string, part: Part): string {
  const [major, minor, patch] = version.split('.').map(Number);

  if (![major, minor, patch].every(Number.isInteger)) {
    out.fail(
      `Version '${version}' is not <major>.<minor>.<patch>, so there is nothing to raise.`,
    );
  }

  switch (part) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

runScript<object, [Part]>({
  command: 'pnpm release:bump',
  title: 'Version bump',
  summary: `Raises the version in package.json and commits it, so a branch is
ready for the cycle after the release that just went out. What it raises is
whatever package.json holds now, not what was last tagged.`,
  options: command =>
    command.addArgument(
      new Argument('<part>', 'Part of the version to raise').choices([
        ...PARTS,
      ]),
    ),
  run: async ({args: [part]}) => {
    const pkg = readPackage();
    const nextVersion = raise(pkg.version, part);

    out.note(`Version: ${pkg.version} → ${nextVersion}`);

    pkg.version = nextVersion;
    fs.writeFileSync(PACKAGE_FILE, `${JSON.stringify(pkg, null, 2)}\n`);

    run('git add package.json');
    run(`git commit -m "chore(release): bump version to ${nextVersion}"`);

    out.ok(`Bumped to ${nextVersion}. Ready to push.`);
  },
});
