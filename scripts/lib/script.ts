import {Command, CommanderError} from 'commander';

import * as out from './output';

/**
 * Configures the options a script accepts, in commander's own vocabulary:
 *
 *     options: command =>
 *       command.option('--file <path>', 'Path to seed.json'),
 *
 * Anything commander supports is available — repeatable `<ids...>`, short
 * aliases, defaults, `--no-x` — because nothing here re-describes it.
 */
export type ScriptOptions = (command: Command) => Command;

/** Describes a script's parser, without saying what to do with what it parses. */
export type CommandSpec = {
  /** Names the command as it is typed, e.g. `pnpm release:prepare`. */
  command: string;
  title: string;
  summary?: string;
  options?: ScriptOptions;
  explain?: ExplainFailure;
};

/**
 * The positionals a script declares, as a tuple. The default is the empty
 * tuple, so a script that declared none cannot read one. An optional
 * positional that was left off arrives as `null` rather than `undefined`,
 * which is what its tuple entry has to say.
 */
export type ScriptArgs = unknown[];

export type ScriptSpec<
  Values = object,
  Args extends ScriptArgs = [],
> = CommandSpec & {
  run: (context: {values: Values; args: Args}) => Promise<void>;
};

/**
 * Turns an error this script understands into the sentence worth reading, or
 * undefined to leave it to the default. An explained error is reported without
 * its stack: a script that can name the cause has said where to look, and the
 * stack would only add noise.
 */
export type ExplainFailure = (error: unknown) => string | undefined;

/** Reports a failure, and says whether anything could explain it. */
export function reportFailure(
  error: unknown,
  explain?: ExplainFailure,
): boolean {
  // An empty string is not an explanation, so it counts as none.
  const explained = explain?.(error) || undefined;

  console.error(
    `${out.RED}✖ ${explained ?? out.describeFailure(error)}${out.RESET}`,
  );
  return explained !== undefined;
}

/**
 * Ends the run the way the failure asks to be ended. A script reporting its own
 * problem has already worded it and chosen the status, so nothing is added to
 * it; anything else is a fault, which gets whatever its script can explain and
 * a stack when nothing can.
 */
function reportAndExit(error: unknown, explain?: ExplainFailure): never {
  if (error instanceof out.ScriptFailure) {
    console.error(`${out.RED}✖ ${error.message}${out.RESET}`);
    process.exit(error.status);
  }

  const explained = reportFailure(error, explain);

  /* The message alone is rarely enough to locate a failure in a seed, unless
   * the script could name the cause itself. */
  if (!explained && error instanceof Error && error.stack) {
    console.error(error.stack);
  }

  process.exit(1);
}

/**
 * Builds the parser every script shares. Two rules are policy rather than
 * preference, so they live here and no script can opt out: an input the parser
 * does not know is an error rather than something silently ignored, and a
 * script declares at most one positional — the subject the command is about,
 * with everything else a named flag. A second positional is where an interface
 * stops being readable: which one is which becomes a matter of memory, and
 * getting the order wrong reads as valid.
 */
export function buildCommand(spec: CommandSpec): Command {
  const command = new Command()
    .name(spec.command)
    .allowExcessArguments(false)
    .exitOverride()
    .showHelpAfterError();

  if (spec.summary) {
    command.description(`${spec.title}\n\n${spec.summary}`);
  } else {
    command.description(spec.title);
  }

  const built = spec.options ? spec.options(command) : command;

  if (built.registeredArguments.length > 1) {
    const names = built.registeredArguments
      .map(argument => argument.name())
      .join(', ');
    out.fail(
      `${spec.command} declares ${built.registeredArguments.length} positional arguments (${names}); a script declares at most one and takes the rest as named flags.`,
    );
  }

  return built;
}

/**
 * Parses a script's options and reports a failure the same way for every
 * script. Nothing here needs a database — see `runTenantScript` for a script
 * that works on a tenant.
 */
export function runScript<Values = object, Args extends ScriptArgs = []>(
  spec: ScriptSpec<Values, Args>,
): void {
  runParsed<Values, Args>(spec, parsed => spec.run(parsed));
}

/**
 * Shared by `runScript` and `runTenantScript`: parse, then hand what was parsed
 * to whatever wants to do the work with it.
 */
export function runParsed<Values = object, Args extends ScriptArgs = []>(
  spec: CommandSpec,
  work: (parsed: {values: Values; args: Args}) => Promise<void>,
): void {
  let values: Values;
  let args: Args;
  let command: Command;

  try {
    /* Built inside the try so a script declaring a flag the runner already
     * owns is reported like any other failure rather than as a crash. */
    command = buildCommand(spec);

    /* pnpm 8.15 forwards the bare `--` of `pnpm <script> -- --flag` as its own
     * argv token. Dropping it makes `pnpm <script> --flag` and
     * `pnpm <script> -- --flag` behave alike. */
    command.parse(
      process.argv.slice(2).filter(argument => argument !== '--'),
      {from: 'user'},
    );
    /* `Values` is a claim, not a check: commander cannot infer the option types
     * from the chain that declared them, so the type has to be kept in step
     * with `options` by hand. What is enforced at runtime is the declaration —
     * `<value>` makes one required, `.choices()` limits it, a parser rejects
     * what it cannot read. */
    values = command.opts<Values & object>();

    /* commander 14 validates each positional as it parses: a missing one and a
     * value outside a declared choice set are errors before this point, as is
     * an extra one under the `allowExcessArguments(false)` set above. So what
     * is left is what the script declared, which is what the tuple names.
     *
     * Taken as `unknown[]` first because commander types this `any[]`, and an
     * `any` assigned straight to the tuple would let a wrong tuple through
     * without a word. */
    const parsed: unknown[] = command.processedArgs;
    args = parsed as Args;
  } catch (error) {
    /* commander 14 writes its own message for a parse error or for --help. A
     * failure while building the command — a script declaring a flag the
     * runner already owns — has not been reported by anyone yet. */
    if (error instanceof CommanderError) {
      process.exit(error.exitCode);
    }

    reportAndExit(error);
  }

  work({values, args}).catch(error => reportAndExit(error, spec.explain));
}
