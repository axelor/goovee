import fs from 'node:fs';
import path from 'node:path';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';

/* The heading each scope is published under. A scope with no entry here is
 * published under its own name, so a new subapp reads sensibly before it is
 * listed — add it here to give it the name the release notes should use. */
const SCOPE_LABELS: Record<string, string> = {
  chat: 'Chat',
  directory: 'Directory',
  events: 'Events',
  forum: 'Forum',
  invoices: 'Invoices',
  news: 'News',
  orders: 'Orders',
  quotations: 'Quotations',
  resources: 'Documents',
  shop: 'E-Shop',
  survey: 'Forms',
  ticketing: 'Helpdesk',
  website: 'Content',
  marketplace: 'Marketplace',
  core: 'Core Platform',
  users: 'User Accounts',
};

/* Both the heading each type is published under and the order the sections
 * appear in, which is why this is a literal rather than sorted. */
const TYPE_LABELS: Record<string, string> = {
  feature: 'Features',
  fix: 'Fixes',
  change: 'Changes',
  deprecate: 'Deprecations',
  remove: 'Removals',
  security: 'Security',
};

/** What a changelog file holds before anything has looked at it. */
type Fields = Record<string, unknown>;

/** One unreleased entry, with the file it was read from — its ticket number. */
type Entry = {
  title: string;
  type: string;
  scope: string[];
  description?: string;
  file: string;
};

type Values = {
  keep?: boolean;
  dryRun?: boolean;
  stdout?: boolean;
  version?: string;
  root: string;
  changelogDir: string;
  package: string;
  output: string;
};

function readVersion(packageFile: string, override?: string): string {
  if (override) return override;

  if (!fs.existsSync(packageFile)) {
    out.fail(`No package.json at ${packageFile}, and no --version given.`);
  }

  const raw: unknown = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
  const version =
    typeof raw === 'object' && raw !== null && 'version' in raw
      ? raw.version
      : undefined;

  /* A heading has to say which release it is, so a version that amounts to
   * nothing is named rather than left blank. */
  return typeof version === 'string' && version.trim() ? version : 'Unreleased';
}

function isNameList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(name => typeof name === 'string' && name.trim().length > 0)
  );
}

/**
 * Reads one entry, either as something publishable or as the reason it is not.
 *
 * An entry is removed once it has been written, so one that reaches no section
 * would be deleted without appearing anywhere: the shape is checked here rather
 * than assumed, and this is what makes the removal safe.
 * `changelogs:validate` reports the same problems first and in more detail.
 */
function readEntry(
  fields: Fields,
  file: string,
): {entry: Entry} | {reason: string} {
  const {title, type, scope, description} = fields;

  if (typeof title !== 'string' || !title.trim()) {
    return {reason: 'no title to publish'};
  }

  /* Checked for its type as well as its value: indexing a label by a
   * one-element array finds the same label the string would, so `['fix']`
   * would otherwise publish as a fix. `hasOwn` because every object answers to
   * `toString` and `__proto__`, and a section is only a section if it is one of
   * ours. */
  if (typeof type !== 'string' || !Object.hasOwn(TYPE_LABELS, type)) {
    return {reason: `type ${JSON.stringify(type)} has no section`};
  }

  if (!isNameList(scope)) {
    return {reason: 'no scope of names to publish it under'};
  }

  if (description !== undefined && typeof description !== 'string') {
    return {reason: 'description is not text'};
  }

  return {entry: {title, type, scope, description, file}};
}

/* Read as plain fields, since a file on disk owes this nothing: what makes an
 * entry is decided by `readEntry`. */
function loadFields(directory: string): {file: string; fields: Fields}[] {
  if (!fs.existsSync(directory)) {
    out.note(`No changelog directory at '${directory}'.`);
    return [];
  }

  const files = fs
    .readdirSync(directory)
    .filter(file => file.endsWith('.json'));
  const loaded: {file: string; fields: Fields}[] = [];

  for (const file of files) {
    const fullPath = path.join(directory, file);

    /* Only the read is guarded: a refusal raised below must not be caught here
     * and reported as a file that could not be read. */
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    } catch (error) {
      out.fail(`Could not read ${file}: ${out.describeFailure(error)}`);
    }

    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      out.fail(`${file} is not a JSON object.`);
    }

    loaded.push({file, fields: {...raw}});
  }

  return loaded;
}

/* Kept in maps rather than objects: a scope is a name out of a JSON file, and a
 * map has no keys of its own for such a name to collide with. */
type Grouped = Map<string, Map<string, Entry[]>>;

/* An entry appears under every scope it names, so one change that touched two
 * subapps is found by a reader looking at either. */
function groupByTypeAndScope(entries: Entry[]): Grouped {
  const grouped: Grouped = new Map();

  for (const entry of entries) {
    let byScope = grouped.get(entry.type);
    if (!byScope) grouped.set(entry.type, (byScope = new Map()));

    for (const scope of entry.scope) {
      const group = byScope.get(scope);
      if (group) group.push(entry);
      else byScope.set(scope, [entry]);
    }
  }

  return grouped;
}

function render(grouped: Grouped, version: string, today: string): string {
  let markdown = `\n\n# ${version} (${today})\n`;

  for (const type of Object.keys(TYPE_LABELS)) {
    const scopes = grouped.get(type);
    if (!scopes || scopes.size === 0) continue;

    markdown += `\n\n## ${TYPE_LABELS[type]}\n`;

    for (const scope of [...scopes.keys()].sort()) {
      const label = Object.hasOwn(SCOPE_LABELS, scope)
        ? SCOPE_LABELS[scope]
        : scope;
      markdown += `\n\n### ${label}\n`;

      const sorted = [...(scopes.get(scope) ?? [])].sort((left, right) =>
        left.title.localeCompare(right.title),
      );

      for (const entry of sorted) {
        const ticket = path.basename(entry.file, '.json');
        markdown += `\n- ${entry.title} – #${ticket}`;

        if (entry.description) {
          /* The description is published inside HTML, where an angle bracket
           * would open a tag instead of being read. */
          const escaped = entry.description
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');

          markdown += `  \n  <details>\n    <summary>Details</summary>\n\n    ${escaped}\n  </details>`;
        }
      }
    }
  }

  return `${markdown.trim()}\n`;
}

runScript<Values>({
  command: 'pnpm changelogs:generate',
  title: 'Changelog generation',
  summary: `Folds every unreleased entry into CHANGELOG.md under one version
heading, writes the same text to RELEASE_NOTES.md as the notes for that release
alone, and removes the entries it consumed.

The version comes from package.json unless --version says otherwise, and the
entries are removed only once they have been written — so --dry-run and
--stdout both leave them in place.`,
  options: command =>
    command
      .option('--keep', 'Keep the entry files instead of removing them')
      .option('--dry-run', 'Show the output only; write and remove nothing')
      .option('--stdout', 'Print the changelog instead of writing it')
      .option('--version <version>', 'Version heading to write')
      .option('--root <dir>', 'Root project directory', '.')
      .option(
        '--changelog-dir <dir>',
        'Directory holding the entry files',
        'changelogs/unreleased',
      )
      .option(
        '--package <file>',
        'package.json to read the version from, relative to --root',
        'package.json',
      )
      .option(
        '--output <file>',
        'Changelog to append to, relative to --root',
        'CHANGELOG.md',
      ),
  run: async ({values}) => {
    const root = path.resolve(values.root);
    const unreleasedDir = path.resolve(root, values.changelogDir);
    const outputFile = path.resolve(root, values.output);
    const releaseNotesFile = path.resolve(root, 'RELEASE_NOTES.md');

    const loaded = loadFields(unreleasedDir);
    if (loaded.length === 0) {
      out.note('No changelog entries to process.');
      return;
    }

    const entries: Entry[] = [];
    const refused: {file: string; reason: string}[] = [];

    for (const {file, fields} of loaded) {
      const read = readEntry(fields, file);

      if ('entry' in read) {
        entries.push(read.entry);
      } else {
        refused.push({file, reason: read.reason});
      }
    }

    if (refused.length > 0) {
      for (const {file, reason} of refused) {
        console.error(`  ${file}: ${reason}`);
      }

      out.fail(
        `${refused.length} entr${refused.length === 1 ? 'y' : 'ies'} cannot be published, so nothing was written. Run \`pnpm changelogs:validate\` for the full picture.`,
      );
    }

    const version = readVersion(
      path.resolve(root, values.package),
      values.version,
    );
    const today = new Date().toISOString().split('T')[0];
    const markdown = render(groupByTypeAndScope(entries), version, today);

    if (values.stdout || values.dryRun) {
      console.log(markdown);
      out.note(
        `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} would be released as ${version}, and left in place.`,
      );
      return;
    }

    const existing = fs.existsSync(outputFile)
      ? fs.readFileSync(outputFile, 'utf-8').trim()
      : '';

    fs.writeFileSync(outputFile, `${`${markdown}\n\n${existing}`.trim()}\n`);
    out.ok(`Changelog written to ${path.relative(process.cwd(), outputFile)}`);

    fs.writeFileSync(releaseNotesFile, `${markdown.trim()}\n`);
    out.ok(
      `Release notes written to ${path.relative(process.cwd(), releaseNotesFile)}`,
    );

    if (values.keep) {
      out.skip(`${entries.length} entry file(s) kept.`);
      return;
    }

    let removed = 0;

    for (const {file} of entries) {
      try {
        fs.unlinkSync(path.join(unreleasedDir, file));
        removed++;
      } catch (error) {
        out.warn(`Could not remove ${file}: ${out.describeFailure(error)}`);
      }
    }

    out.ok(`${removed} of ${entries.length} entry file(s) removed.`);
  },
});
