import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export function createHMAC(value: string, secret: string) {
  if (!(value && secret)) return;

  const hmac = crypto.createHmac('sha512', Buffer.from(secret, 'hex'));
  hmac.update(value, 'utf-8');
  return hmac.digest('hex').toUpperCase();
}

export function verifySignature(
  message: string,
  signature: string,
  publicKeyPem: string,
) {
  if (!message || !signature || !publicKeyPem) {
    return false;
  }

  try {
    const verifier = crypto.createVerify('SHA1');

    verifier.update(message);
    verifier.end();

    const signatureBuffer = Buffer.from(signature, 'base64');

    const isValid = verifier.verify(publicKeyPem, signatureBuffer);

    return isValid;
  } catch (error) {
    console.error('[UP2PAY][SIGNATURE] Verification error', {
      error: (error as Error).message,
    });
    return false;
  }
}

export function readPEMFile(filePath?: string): string {
  try {
    const resolvedPath = filePath
      ? path.resolve(filePath)
      : path.join(process.cwd(), 'certs', 'up2pay', 'public-key.pem');

    if (!fs.existsSync(resolvedPath)) {
      return '';
    }

    const pemContent = fs.readFileSync(resolvedPath, 'utf8');

    return pemContent;
  } catch (error) {
    console.error('[UP2PAY][PEM] Error reading PEM file', {
      error: (error as Error).message,
    });
    return '';
  }
}
