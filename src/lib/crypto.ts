import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from the environment.
 * Key must be a 32-byte hex string (64 characters).
 * Falls back to a deterministic key in development for testing.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is required in production");
    }
    // Development fallback - NOT for production use
    return Buffer.from(
      "0000000000000000000000000000000000000000000000000000000000000000",
      "hex"
    );
  }
  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing IV + auth tag + ciphertext.
 * Returns null if the input is null or undefined.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") {
    return null;
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Expects a base64-encoded string containing IV + auth tag + ciphertext.
 * Returns null if the input is null or undefined.
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null || ciphertext === "") {
    return null;
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(ciphertext, "base64");

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid ciphertext: too short");
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
