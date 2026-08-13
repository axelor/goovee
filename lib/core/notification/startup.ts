// ---- LOCAL IMPORTS ---- //
import {getTransporter} from './mail';

/**
 * Report at startup whether mail can be delivered.
 *
 * Mail failures are invisible from inside the portal: every way the settings can
 * be wrong looks the same from here, and the portal carries on while password
 * resets, one-time codes and notifications never arrive. So it is stated once, at
 * boot. The check opens a connection and authenticates, then quits it, using a
 * throwaway connection rather than one of the pool's.
 *
 * Failing does not stop the server — a portal that cannot send mail still serves
 * every page.
 */
export async function checkMailTransport(): Promise<void> {
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT;

  try {
    const transporter = getTransporter();

    /* Asking for the transport is what decides whether mail is configured, and
     * that decision reports itself. */
    if (!transporter) {
      return;
    }

    await transporter.verify();

    const maxConnections = (
      transporter as unknown as {options: {maxConnections?: number}}
    ).options.maxConnections;

    console.log(
      `[MAIL][STARTUP] mail server accepted a connection — ${host}:${port} reachable and credentials accepted; ` +
        `pool holds up to ${maxConnections} connections (set MAIL_MAX_CONNECTIONS if the server allows fewer)`,
    );
  } catch (error) {
    console.error(
      `[MAIL][STARTUP] mail server is NOT usable — no mail will arrive, including password resets and one-time codes. ` +
        `Check that ${host}:${port} is reachable from the server and that MAIL_USER and MAIL_PASSWORD are accepted.`,
      error,
    );
  }
}
