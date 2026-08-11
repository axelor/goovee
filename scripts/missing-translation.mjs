#!/usr/bin/env node
// Usage: node scripts/missing-translation.mjs <locale> [path-to-directory]
// Example: node scripts/missing-translation.mjs en
//          node scripts/missing-translation.mjs fr app

import { readFileSync, readdirSync } from "fs";
import { join, extname } from "path";
import ts from "typescript";

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: node scripts/missing-translation.mjs <locale> [path-to-directory]");
  process.exit(1);
}

const locale = args[0];
const searchDir = args[1] ?? ".";
const jsonFile = `public/locales/${locale}.json`;

let translationKeys;
try {
  translationKeys = new Set(
    Object.keys(JSON.parse(readFileSync(jsonFile, "utf8")))
  );
} catch {
  console.error(`Error: Could not read or parse '${jsonFile}'`);
  process.exit(1);
}

function* walkTs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      yield* walkTs(full);
    } else if (entry.isFile() && (extname(entry.name) === ".tsx" || extname(entry.name) === ".ts")) {
      yield full;
    }
  }
}

/* Which argument carries the translation key, per translator function. */
const keyArgumentIndex = {
  t: 0,
  "i18n.t": 0,
  getTranslation: 1,
};

function calleeName(expression) {
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
function staticKey(argument) {
  if (!argument) return undefined;

  if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
    return argument.text;
  }

  return undefined;
}

const foundKeys = new Set();

for (const file of walkTs(searchDir)) {
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    false,
    extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression);
      /* hasOwn so an inherited name like "constructor" cannot reach the lookup. */
      const index =
        name !== undefined && Object.hasOwn(keyArgumentIndex, name)
          ? keyArgumentIndex[name]
          : undefined;

      if (index !== undefined) {
        const key = staticKey(node.arguments[index]);
        if (key !== undefined) {
          foundKeys.add(key);
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
}

const missing = [...foundKeys].sort().filter((k) => k && !translationKeys.has(k));

for (const key of missing) {
  console.log(key);
}
