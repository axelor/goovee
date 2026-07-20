/* Version-number parsing and display.
 *
 * Owners type a single string (`"2"`, `"1.2"`, `"1.2.3"`, `"1.2.3-rc1"`); we
 * parse it into four sortable columns and store only those. The string is
 * never persisted — it is reconstructed on read via `formatVersionNumber`.
 *
 * Sort rule: `(vMajor, vMinor, vPatch)` numerically, then `vPreRelease` —
 * a NULL/missing pre-release sorts ABOVE any tag, so `1.2.3` > `1.2.3-rc2`.
 * Among tagged versions, the tag is compared lexicographically — owners are
 * responsible for picking tags that sort correctly among themselves. */

export const VERSION_NUMBER_PATTERN = /^\d+(\.\d+){0,2}(-[A-Za-z0-9]+)?$/;

export type VersionNumberParts = {
  vMajor: number;
  vMinor: number;
  vPatch: number;
  vPreRelease: string | null;
};

export function parseVersionNumber(raw: string): VersionNumberParts | null {
  if (!VERSION_NUMBER_PATTERN.test(raw)) return null;
  const [head, tail] = raw.split('-', 2);
  const [maj, min, patch] = head.split('.');
  return {
    vMajor: Number(maj),
    vMinor: min ? Number(min) : 0,
    vPatch: patch ? Number(patch) : 0,
    vPreRelease: tail ?? null,
  };
}

export function formatVersionNumber(v: {
  vMajor: number;
  vMinor: number | null;
  vPatch: number | null;
  vPreRelease: string | null;
}): string {
  const base = `${v.vMajor}.${v.vMinor ?? 0}.${v.vPatch ?? 0}`;
  return v.vPreRelease ? `${base}-${v.vPreRelease}` : base;
}
