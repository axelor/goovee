import {loadEnvConfig} from '@next/env';

/*
 * Loads the `.env` files the way the server does.
 *
 * `next dev`, `next build` and `next start` all read the environment through
 * this same function before any application code runs, so a script that imports
 * this module sees exactly what the server would: the same four files in the
 * same order (`.env.<mode>.local`, `.env.local`, `.env.<mode>`, `.env`), the
 * same first-wins rule, the same `${VAR}` expansion inside values, and a process
 * environment that always wins over every file. Reimplementing that list by hand
 * is how `config:check` came to validate a document `next start` never read.
 *
 * The mode follows NODE_ENV the way Node itself reads it: `production` selects
 * the production files, as `next start` does, and anything else — including an
 * unset value — selects the development files, as `next dev` does. A checkout
 * therefore reads its development files, which is what a seed or reset script
 * run by hand has to hit, while a server, where NODE_ENV=production is already
 * set, reads its own; `NODE_ENV=production pnpm config:check` reads a server's
 * files from anywhere else.
 *
 * Import this first, before anything that reads the environment as it is
 * evaluated — the configuration loader and the base path both do. A script
 * imports it if and only if it reads the configuration or a build-time variable;
 * the release, changelog and translation scripts read neither and must not,
 * since a script whose behaviour follows the `.env.local` of whichever checkout
 * it runs from is a script that behaves differently on every machine.
 */
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
