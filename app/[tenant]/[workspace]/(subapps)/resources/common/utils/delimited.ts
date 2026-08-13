/** Separators a table of values is written with, most common first. */
const SEPARATORS = [',', ';', '\t', '|'];

/**
 * Work out which separator a file uses by counting them in its first line.
 *
 * The extension says only that the file is a table of values, not what
 * separates them: a semicolon is as common as a comma wherever the comma is a
 * decimal point. Counting is enough to tell them apart, and a file with none of
 * them reads as a single column either way.
 */
export function detectSeparator(text: string): string {
  const [firstLine = ''] = text.split('\n', 1);

  let best = SEPARATORS[0];
  let bestCount = 0;

  for (const separator of SEPARATORS) {
    const count = firstLine.split(separator).length - 1;
    if (count > bestCount) {
      best = separator;
      bestCount = count;
    }
  }

  return best;
}

/**
 * Split a table of values into rows and cells.
 *
 * A quoted value carries separators and line breaks of its own, and a quote
 * inside one is written twice — so the file cannot be split on separators
 * alone and is read a character at a time instead.
 *
 * A quote only begins a quoted value where one could begin: at the start of a
 * cell, allowing for spaces before it. Anywhere else it is the character
 * itself, which is how a length written as `3" pipe` stays one cell instead of
 * swallowing everything up to the next quote.
 */
export function parseDelimited(text: string, separator: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    if (quoted) {
      if (character !== '"') {
        value += character;
      } else if (text[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        quoted = false;
      }
      continue;
    }

    if (character === '"' && value.trim() === '') {
      quoted = true;
    } else if (character === separator) {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (character !== '\r') {
      value += character;
    }
  }

  /* Whatever is left when the file ends without a final line break. */
  if (value !== '' || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}
