import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';
import {capture, installed, run} from '@/scripts/lib/shell';

import {version} from '../package.json';

const PIPELINE_PROJECT = 'infrastructure/release-tool/axelor-goovee-release';

/* The repository a release is published from, identified by host and path
 * rather than by a remote's name: a checkout calls its remotes whatever it
 * likes, and several forks of this project differ from it by one path segment.
 * Both major lines live here, so this holds on every release branch. */
const CANONICAL_REPO = 'github.com/axelor/goovee';

/* Reduces any of the spellings git accepts — `git@host:path.git`,
 * `https://host/path`, `ssh://git@host/path` — to `host/path`, so two ways of
 * naming the same repository compare equal.
 *
 * Order carries the weight: the protocol goes before the user, or a `git@`
 * left by an `ssh://` URL survives into the answer, and the trailing slash goes
 * before `.git`, or `…/goovee.git/` keeps its suffix. A form this does not
 * flatten — a URL carrying a port, say — simply fails to match, which is
 * reported rather than assumed away. */
function repoOf(url: string): string {
  return url
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^[^@/]+@/, '')
    .replace(':', '/')
    .replace(/\/+$/, '')
    .replace(/\.git$/, '')
    .toLowerCase();
}

function canonicalRemote(): string {
  for (const line of capture('git remote -v').split('\n')) {
    const [name, url, kind] = line.trim().split(/\s+/);

    if (kind === '(fetch)' && url && repoOf(url) === CANONICAL_REPO) {
      return name;
    }
  }

  out.fail(
    `No remote points at ${CANONICAL_REPO}, so there is nothing to publish from.`,
  );
}

/* The release branches, and what each one means for the GitHub release: only
 * the branch carrying the newest minor may claim to be the latest, so a patch
 * to an older line does not displace it. */
const CURRENT_LINE = 'main';
const OLDER_LINE_PREFIX = 'release/';

function currentBranch(): string {
  return capture('git rev-parse --abbrev-ref HEAD');
}

runScript({
  command: 'pnpm release',
  title: 'Release trigger',
  summary: `Triggers the GitLab pipeline that publishes the GitHub release and
the Docker image for the version in package.json.

It reads the version and the branch rather than taking them, so the release can
only be what the checked-out branch already says it is. The tag itself is made
by the tag workflow when a release branch is pushed, not here.`,
  run: async () => {
    const branch = currentBranch();

    if (branch !== CURRENT_LINE && !branch.startsWith(OLDER_LINE_PREFIX)) {
      out.fail(
        `On '${branch}': a release runs from '${CURRENT_LINE}' or '${OLDER_LINE_PREFIX}*', which are the branches a version is published from.`,
      );
    }

    const makeLatest = branch === CURRENT_LINE;

    out.note(`Branch: ${branch}`);
    out.note(`Version: v${version}`);
    out.note(`Make latest: ${makeLatest}`);

    /* glab authenticates against the host it was set up with, so a missing CLI
     * is worth saying plainly rather than letting the shell report it. */
    if (!installed('glab')) {
      out.fail(
        'glab is not installed, so the pipeline cannot be triggered. See https://docs.gitlab.com/cli/',
      );
    }

    /* Both questions are asked of the repository rather than of this checkout,
     * because the version being published is read from a local file: a branch
     * that is behind would publish the release before it, and a version with no
     * tag has nothing for the pipeline to build a release from. */
    const remote = canonicalRemote();

    /* `--heads` so the pattern cannot also match a ref outside `refs/heads/`
     * that happens to end the same way, which would answer with the wrong
     * commit. */
    const published = capture(
      `git ls-remote --heads ${remote} refs/heads/${branch}`,
    ).split(/\s+/)[0];

    if (!published) {
      out.fail(`'${branch}' does not exist on ${remote} (${CANONICAL_REPO}).`);
    }

    if (published !== capture('git rev-parse HEAD')) {
      out.fail(
        `Local '${branch}' is not what ${remote} has. Push or pull first, so the version published is the one that was released.`,
      );
    }

    if (!capture(`git ls-remote --tags ${remote} refs/tags/v${version}`)) {
      out.fail(
        `v${version} is not tagged on ${remote}. The tag workflow makes it when a release branch is pushed — wait for it, then run this again.`,
      );
    }

    run(
      `glab ci run -R ${PIPELINE_PROJECT} -b main --variables GOOVEE_VERSION:v${version} --variables MAKE_LATEST:${makeLatest}`,
    );

    out.ok(`Pipeline triggered for v${version}.`);
  },
});
