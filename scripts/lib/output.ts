/* Console output shared by the maintenance scripts, so a result looks the same
 * whichever one produced it. Nothing here needs a database.
 *
 * `warn` and `annotate` write to stderr and the rest to stdout, so a script
 * whose stdout carries data it expects to be piped can report alongside it.
 * `fail` prints nothing itself — it raises, and the runner does the printing. */

export const RED = '\x1b[31m';
export const GREEN = '\x1b[32m';
export const YELLOW = '\x1b[33m';
export const CYAN = '\x1b[36m';
export const DIM = '\x1b[90m';
export const BOLD = '\x1b[1m';
export const RESET = '\x1b[0m';

/**
 * Turns anything that was thrown into the line worth printing.
 *
 * A `catch` binding is `unknown` because a throw is not obliged to be an
 * `Error`, so asking one for `.message` is a guess that reads as a fact. This
 * asks only what the value can answer.
 */
export function describeFailure(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Formats a success line without printing it, for a caller that has to choose
 * the stream itself rather than take the one `ok` writes to.
 */
export function okText(message: string): string {
  return `${GREEN}✔ ${message}${RESET}`;
}

export function ok(message: string): void {
  console.log(okText(message));
}

export function note(message: string): void {
  console.log(`${CYAN}→ ${message}${RESET}`);
}

export function skip(message: string): void {
  console.log(`  ${YELLOW}∅ skip${RESET} ${message}`);
}

export function warn(message: string): void {
  console.error(`${YELLOW}⚠ ${message}${RESET}`);
}

/**
 * A failure a script is reporting about itself: worded already, and not a fault
 * to hunt down, so the runner prints the message without a stack.
 *
 * The runner matches it by class, which holds because this module has a single
 * copy — nothing resolves a second one.
 */
export class ScriptFailure extends Error {
  readonly status: number;

  constructor(message: string, status = 1) {
    super(message);
    this.name = 'ScriptFailure';
    this.status = status;
  }
}

/**
 * Stops the script with a problem to report.
 *
 * Raised rather than printed, so that whatever the run has open is released on
 * the way out — a `finally` does not run when the process exits from under it.
 * The runner prints the message and ends with `status`.
 *
 * @param status - exit code to end with; the default says only that the script
 *   failed, so pass one on when relaying the status of something that ran.
 */
export function fail(message: string, status = 1): never {
  throw new ScriptFailure(message, status);
}

/**
 * Escapes a message for a workflow annotation, which ends at the first newline
 * and reads `%` as the start of an escape — either of which a reported value
 * may contain.
 */
function annotationText(message: string): string {
  return message
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A');
}

/**
 * Points a workflow run at the line that caused a problem. Silent elsewhere,
 * since the syntax is only meaningful to the workflow that reads it.
 */
export function annotate({
  file,
  line,
  column,
  message,
}: {
  file: string;
  line: number;
  column?: number;
  message: string;
}): void {
  if (process.env.GITHUB_ACTIONS !== 'true') return;

  const position = column === undefined ? '' : `,col=${column}`;
  console.error(
    `::error file=${file},line=${line}${position}::${annotationText(message)}`,
  );
}
