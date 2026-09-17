/**
 * Whether a transfer ended because the other end went away, rather than because
 * the store failed to take the bytes.
 *
 * A pause, a closed tab, a dropped connection and a gateway giving up all
 * surface this way, and the bytes that arrived first are as good as any others.
 * A failure to write — a full disk, a refused bucket — is the store's own.
 */
export function isTransferInterrupted(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = (error as NodeJS.ErrnoException).code;

  return (
    code === 'ECONNRESET' ||
    code === 'ECONNABORTED' ||
    code === 'ERR_STREAM_PREMATURE_CLOSE' ||
    code === 'ECANCELED' ||
    error.name === 'AbortError'
  );
}
