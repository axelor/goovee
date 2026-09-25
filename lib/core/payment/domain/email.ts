/**
 * Whether two addresses name the same mailbox, as a payer's address is
 * compared everywhere: letter case and surrounding spaces ignored. Empty on
 * either side matches nothing.
 */
export function isSameEmail(
  first: string | null | undefined,
  second: string | null | undefined,
): boolean {
  const left = first?.trim().toLowerCase();
  const right = second?.trim().toLowerCase();
  return Boolean(left && right && left === right);
}
