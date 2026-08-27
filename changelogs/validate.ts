import fs from 'node:fs';
import path from 'node:path';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';

const UNRELEASED_DIR = path.join(__dirname, 'unreleased');

const VALID_TYPES = new Set([
  'feature',
  'change',
  'deprecate',
  'remove',
  'fix',
  'security',
]);

const REQUIRED_FIELDS = ['title', 'type', 'scope'] as const;

/* What each problem is said about, so a caller can report it against the entry
 * rather than against the run. */
type Problem = {file: string; message: string};

function readEntry(filePath: string): unknown {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/* Every problem with one entry, so a run reports them all rather than the first
 * of each file. An unreadable or unparseable file has only one. */
function validateEntry(filePath: string): string[] {
  let entry: unknown;

  try {
    entry = readEntry(filePath);
  } catch (error) {
    return [`Could not be read as JSON: ${out.describeFailure(error)}`];
  }

  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    return ['Must be a JSON object.'];
  }

  const fields: Record<string, unknown> = {...entry};
  const problems: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in fields)) problems.push(`Missing required field: '${field}'`);
  }

  /* Compared without coercing: `['fix']` becomes the string 'fix' on the way
   * into a Set, and an entry whose type is a list is not a valid entry. */
  if (
    'type' in fields &&
    (typeof fields.type !== 'string' || !VALID_TYPES.has(fields.type))
  ) {
    problems.push(
      `Invalid 'type': ${JSON.stringify(fields.type)} (must be one of ${[...VALID_TYPES].join(', ')})`,
    );
  }

  /* Blank counts as absent for anything that gets published: a heading or a
   * line with nothing in it is not something a release can show. */
  if ('title' in fields) {
    const title = fields.title;

    if (typeof title !== 'string' || !title.trim()) {
      problems.push(`'title' must be text, and not blank`);
    }
  }

  if ('scope' in fields) {
    const scope = fields.scope;
    const usable =
      Array.isArray(scope) &&
      scope.length > 0 &&
      scope.every(
        scopeName => typeof scopeName === 'string' && scopeName.trim(),
      );

    if (!usable) {
      problems.push(`'scope' must be a non-empty array of non-blank strings`);
    }
  }

  if ('description' in fields && typeof fields.description !== 'string') {
    problems.push(`'description' must be a string if provided`);
  }

  return problems;
}

runScript({
  command: 'pnpm changelogs:validate',
  title: 'Changelog entry validation',
  summary: `Checks every unreleased changelog entry, and reports each problem
against the entry it belongs to. Run before generating a changelog: an entry
that is readable but malformed is the one that reaches a release without its
note, and this is what names it.`,
  run: async () => {
    if (!fs.existsSync(UNRELEASED_DIR)) {
      out.fail(
        `No '${path.relative(process.cwd(), UNRELEASED_DIR)}' directory.`,
      );
    }

    const files = fs
      .readdirSync(UNRELEASED_DIR)
      .filter(file => file.endsWith('.json'))
      .sort();

    const problems: Problem[] = [];

    for (const file of files) {
      const fullPath = path.join(UNRELEASED_DIR, file);
      const relativePath = path.relative(process.cwd(), fullPath);

      for (const message of validateEntry(fullPath)) {
        problems.push({file: relativePath, message});
        out.annotate({file: relativePath, line: 1, column: 1, message});
      }
    }

    if (problems.length > 0) {
      for (const problem of problems) {
        console.error(`  ${problem.file}: ${problem.message}`);
      }

      out.fail(
        `${problems.length} problem(s) across ${files.length} changelog entr${files.length === 1 ? 'y' : 'ies'}.`,
      );
    }

    if (files.length === 0) {
      out.ok('No changelog entries to check.');
      return;
    }

    out.ok(`All ${files.length} changelog entries are valid.`);
  },
});
