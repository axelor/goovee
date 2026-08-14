// ---- LOCAL IMPORTS ---- //
import {getMaxConnections, getTransporter} from './mail';

/**
 * Report at startup whether mail can be delivered — nothing else in the portal
 * surfaces a bad mail configuration. `verify()` opens its own connection and
 * authenticates, then quits it, so it does not consume one of the pool's.
 */
export async function checkMailTransport(): Promise<void> {
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT;

  try {
    const transporter = getTransporter();

    // getTransporter() already logged this.
    if (!transporter) {
      return;
    }

    await transporter.verify();

    /* Read from the same place the pool was sized from. Reaching into the
     * transport's own options would mean holding a typed handle on an object that
     * also carries the password. */
    const maxConnections = getMaxConnections();

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
