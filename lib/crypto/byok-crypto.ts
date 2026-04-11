import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;

function getKey(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("KEY_ENCRYPTION_SECRET missing or too short");
  }
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv, {
    authTagLength: 16,
  });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return Buffer.concat([iv, enc]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const rest = buf.subarray(IV_LEN);
  const tag = rest.subarray(rest.length - 16);
  const data = rest.subarray(0, rest.length - 16);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv, {
    authTagLength: 16,
  });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
