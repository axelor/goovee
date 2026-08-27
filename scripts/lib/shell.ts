import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import * as out from './output';

/* What execSync attaches to the error it throws. Read rather than asserted,
 * because a spawn that never reached a command carries neither field. */
function exitStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined;
  }

  return typeof error.status === 'number' ? error.status : undefined;
}

function killedBy(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('signal' in error)) {
    return undefined;
  }

  return typeof error.signal === 'string' ? error.signal : undefined;
}

/**
 * Ends the script over a command that did not succeed, the same way for
 * whichever reason it did not.
 *
 * A command that ran has an exit code, which is the answer worth relaying. One
 * killed by a signal has that instead, and one that could not start has
 * neither — in both of those the command said nothing itself.
 */
function failedCommand(command: string, error: unknown): never {
  const status = exitStatus(error);
  if (status !== undefined) {
    out.fail(`\`${command}\` failed (exit ${status}).`, status);
  }

  const signal = killedBy(error);
  if (signal !== undefined) {
    out.fail(`\`${command}\` was killed by ${signal}.`);
  }

  out.fail(`\`${command}\` could not be run: ${out.describeFailure(error)}`);
}

/**
 * Runs a command for what it does, showing it and letting its own output
 * through. The command has already reported whatever it had to say, so nothing
 * here repeats it.
 */
export function run(command: string): void {
  console.log(`${out.DIM}> ${command}${out.RESET}`);

  try {
    execSync(command, {stdio: 'inherit'});
  } catch (error) {
    failedCommand(command, error);
  }
}

/**
 * Runs a command for what it prints, and answers with that, trimmed.
 *
 * Not shown as a step, because reading a value is not one. Only stdout is
 * captured: the command keeps stderr, so a failure still explains itself in the
 * terminal rather than disappearing into a string nobody reads.
 */
export function capture(command: string): string {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'inherit'],
    }).trim();
  } catch (error) {
    failedCommand(command, error);
  }
}

/**
 * Says whether a command is on the PATH as a file that can be executed.
 *
 * Answered by looking rather than by running: a script that needs to say
 * something friendlier than a shell's "not found" has to ask before it tries,
 * and asking must not itself be able to fail.
 */
export function installed(binary: string): boolean {
  return (process.env.PATH ?? '')
    .split(path.delimiter)
    .filter(Boolean)
    .some(directory => {
      const candidate = path.join(directory, binary);

      try {
        /* A directory carries the execute bit too, where it means the right to
         * walk into it — so being executable is only half the question. */
        if (!fs.statSync(candidate).isFile()) return false;

        fs.accessSync(candidate, fs.constants.X_OK);
        return true;
      } catch {
        return false;
      }
    });
}
