import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import path from 'path';

function getCertOptions(): {cert: Buffer; key: Buffer} {
  const certsDir = path.join(process.cwd(), 'certs', 'hubpisp');
  return {
    cert: fs.readFileSync(path.join(certsDir, 'client.crt')),
    key: fs.readFileSync(path.join(certsDir, 'private-key.pem')),
  };
}

/**
 * fetch-compatible wrapper using node:https with mTLS client certificate.
 * Required because Node's built-in fetch does not support client certs.
 */
export function pispFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const method = (init.method ?? 'GET').toUpperCase();

    const body =
      init.body != null ? Buffer.from(init.body as string) : undefined;

    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string>),
      ...(body ? {'Content-Length': String(body.byteLength)} : {}),
    };

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method,
        headers,
        ...getCertOptions(),
      },
      res => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const responseBody = Buffer.concat(chunks).toString('utf8');

          resolve(
            new Response(responseBody, {
              status: res.statusCode ?? 200,
              headers: res.headers as Record<string, string>,
            }),
          );
        });
      },
    );

    req.on('error', error => {
      console.error('[PISP_FETCH] Request error:', error);
      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}
/**
 * Fetches a Bearer token from the HUB PISP OAuth endpoint.
 * Uses Basic auth: base64(clientId:clientSecret).
 */
export async function getPispAccessToken(): Promise<string> {
  const clientId = process.env.HUBPISP_CLIENT_ID;
  const clientSecret = process.env.HUBPISP_CLIENT_SECRET;
  const tokenUrl = process.env.HUBPISP_TOKEN_URL;

  if (!(clientId && clientSecret && tokenUrl)) {
    console.error('[HUBPISP][AUTH] Missing credentials', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasTokenUrl: !!tokenUrl,
    });
    throw new Error('HUB PISP credentials are not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64',
  );

  const response = await pispFetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) {
    const body = await response.text();
    console.error('[HUBPISP][AUTH] Token fetch failed', {
      status: response.status,
      body,
    });
    throw new Error(
      `HUB PISP token fetch failed (${response.status}): ${body}`,
    );
  }

  const data = await response.json();
  return data.access_token as string;
}

/**
 * Computes the Digest header value (SHA-256 of the JSON body).
 * Format: SHA-256=<base64(sha256(body))>
 */
export function generateDigest(body: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(body, 'utf8')
    .digest('base64');
  return `SHA-256=${hash}`;
}

/**
 * Signs the HTTP message string using the merchant private key (RSA-SHA256).
 * Returns the base64-encoded signature.
 *
 * The signed string is:
 *   (request-target): <method> <path>\n
 *   digest: <digest>\n
 *   date: <date>\n
 *   x-request-id: <xRequestId>
 */
export function generateSignature({
  requestTarget,
  digest,
  date,
  xRequestId,
}: {
  requestTarget: string;
  digest: string;
  date: string;
  xRequestId: string;
}): string {
  const keyPath = path.join(
    process.cwd(),
    'certs',
    'hubpisp',
    'private-key.pem',
  );

  if (!fs.existsSync(keyPath)) {
    console.error('[HUBPISP][SIGN] Private key file not found', {keyPath});
    throw new Error('HUB PISP private key is not configured');
  }

  const pem = fs.readFileSync(keyPath, 'utf8');

  const signingString = [
    `(request-target): ${requestTarget}`,
    `digest: ${digest}`,
    `date: ${date}`,
    `x-request-id: ${xRequestId}`,
  ].join('\n');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingString, 'utf8');
  sign.end();

  const signature = sign.sign(pem, 'base64');
  return signature;
}

/**
 * Builds the full set of signed request headers for a HUB PISP API call.
 */
export function buildPispHeaders({
  token,
  keyId,
  requestTarget,
  digest,
  date,
  xRequestId,
}: {
  token: string;
  keyId: string;
  requestTarget: string;
  digest: string;
  date: string;
  xRequestId: string;
}): Record<string, string> {
  const signature = generateSignature({
    requestTarget,
    digest,
    date,
    xRequestId,
  });

  const signatureHeader = `keyId="${keyId.toLowerCase()}",algorithm="rsa-sha256",headers="(request-target) digest date x-request-id",signature="${signature}"`;

  const result = {
    Authorization: `Bearer ${token}`,
    Digest: digest,
    Date: date,
    'X-Request-ID': xRequestId,
    Signature: signatureHeader,
  };

  return result;
}
