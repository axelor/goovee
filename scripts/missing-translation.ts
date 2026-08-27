import {readFileSync, readdirSync} from 'node:fs';
import {extname, join} from 'node:path';
import ts from 'typescript';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';
import {Argument} from 'commander';

/** Says which argument carries the translation key, per translator function. */
const keyArgumentIndex: Record<string, number> = {
  t: 0,
  'i18n.t': 0,
  getTranslation: 1,
};

function* walkTs(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      yield* walkTs(full);
    } else if (
      entry.isFile() &&
      (extname(entry.name) === '.tsx' || extname(entry.name) === '.ts')
    ) {
      yield full;
    }
  }
}

function calleeName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    ts.isIdentifier(expression.name)
  ) {
    return `${expression.expression.text}.${expression.name.text}`;
  }

  return undefined;
}

/* The key a call passes at runtime, or undefined when the argument is not a
 * static string. Both node kinds expose `text` already decoded, so a `\'`
 * written inside a single-quoted literal is compared as the apostrophe the
 * locale file stores; comparing raw source text would carry the backslash and
 * never match. A template literal with no substitutions is as much a key as a
 * quoted string. */
function staticKey(argument: ts.Expression | undefined): string | undefined {
  if (!argument) return undefined;

  if (
    ts.isStringLiteral(argument) ||
    ts.isNoSubstitutionTemplateLiteral(argument)
  ) {
    return argument.text;
  }

  return undefined;
}

type KeyUse = {file: string; line: number; column: number};

/* Every place a key is used, so a missing one can be reported where it is
 * written rather than only by name. */
function collectKeys(searchDir: string): Map<string, KeyUse[]> {
  const foundKeys = new Map<string, KeyUse[]>();

  for (const file of walkTs(searchDir)) {
    let source: string;
    try {
      source = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      false,
      extname(file) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const name = calleeName(node.expression);
        // hasOwn so an inherited name like "constructor" cannot reach the lookup.
        const index =
          name !== undefined && Object.hasOwn(keyArgumentIndex, name)
            ? keyArgumentIndex[name]
            : undefined;

        if (index !== undefined) {
          const argument = node.arguments[index];
          const key = staticKey(argument);

          if (key !== undefined) {
            const {line, character} = sourceFile.getLineAndCharacterOfPosition(
              argument.getStart(sourceFile),
            );

            const uses = foundKeys.get(key) ?? [];
            uses.push({file, line: line + 1, column: character + 1});
            foundKeys.set(key, uses);
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
  }

  return foundKeys;
}

/* Every `.ts` and `.tsx` under here is read, so the whole project is searched
 * from wherever pnpm put us. */
const SEARCH_ROOT = '.';

runScript<object, [string]>({
  command: 'pnpm translations:check',
  title: 'Missing translation finder',
  summary: `Lists every translation key used in the code that the given locale
file does not define. Only keys passed as a literal string are found, since a
key built at runtime cannot be resolved by reading the source.`,
  options: command =>
    command.addArgument(
      new Argument('<locale>', 'Locale to check, e.g. en or fr_FR'),
    ),
  run: async ({args: [locale]}) => {
    const localeFile = `public/locales/${locale}.json`;

    let defined: Set<string>;
    try {
      defined = new Set(
        Object.keys(JSON.parse(readFileSync(localeFile, 'utf8'))),
      );
    } catch {
      out.fail(`Could not read or parse '${localeFile}'.`);
    }

    const used = collectKeys(SEARCH_ROOT);
    const missing = [...used.entries()]
      .filter(([key]) => key && !defined.has(key))
      .sort(([left], [right]) => left.localeCompare(right));

    /* The bare keys stay on stdout: the usual next step is to paste them into
     * the locale file. */
    for (const [key] of missing) {
      console.log(key);
    }

    /* Where each key is used goes to stderr, so the keys on stdout stay
     * pasteable into the locale file on their own. */
    for (const [key, uses] of missing) {
      console.error(`${out.YELLOW}"${key}"${out.RESET} is used at`);

      for (const {file, line, column} of uses) {
        console.error(`  ${file}:${line}:${column}`);
        out.annotate({
          file,
          line,
          column,
          message: `Missing translation key "${key}" in ${localeFile}`,
        });
      }
    }

    if (missing.length) {
      out.fail(
        `${missing.length} key(s) used in the code are missing from ${localeFile}.`,
      );
    }

    /* On stderr like every other message here: stdout carries the keys, so
     * redirecting stderr away leaves exactly the list and nothing else. */
    console.error(
      out.okText(`Every key used in the code is defined in ${localeFile}.`),
    );
  },
});
