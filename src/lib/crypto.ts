import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw || raw.length === 0) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  return scryptSync(trimmed, "interniq-token-salt", KEY_LENGTH);
}

/**
 * Encrypts a string for storage. Returns `iv:authTag:ciphertext` (base64url segments).
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const ivB64 = iv.toString("base64url");
  const tagB64 = authTag.toString("base64url");
  const ctB64 = encrypted.toString("base64url");
  return `${ivB64}:${tagB64}:${ctB64}`;
}

/**
 * Returns true if the value looks like our encrypted format (three base64url segments).
 */
function looksEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0 && /^[A-Za-z0-9_-]+$/.test(p));
}

/**
 * Decrypts a stored token. If the value is not in encrypted format, returns it unchanged (backward compatibility).
 */
export function decryptTokenIfEncrypted(stored: string): string {
  if (!stored) return stored;
  if (!looksEncrypted(stored)) {
    return stored;
  }
  const [ivB64, tagB64, ctB64] = stored.split(":");
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64url");
  const authTag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(ctB64, "base64url");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
