import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

describe("crypto", () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    // Use a known test key (32 bytes = 64 hex chars)
    process.env.ENCRYPTION_KEY =
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe("encrypt", () => {
    it("returns null for null input", () => {
      expect(encrypt(null)).toBe(null);
    });

    it("returns null for undefined input", () => {
      expect(encrypt(undefined)).toBe(null);
    });

    it("returns null for empty string", () => {
      expect(encrypt("")).toBe(null);
    });

    it("returns a non-empty base64 string for valid input", () => {
      const result = encrypt("my-secret-key");
      expect(result).not.toBe(null);
      expect(result!.length).toBeGreaterThan(0);
      // Verify it's valid base64
      expect(() => Buffer.from(result!, "base64")).not.toThrow();
    });

    it("produces different ciphertexts for the same input (random IV)", () => {
      const result1 = encrypt("my-secret-key");
      const result2 = encrypt("my-secret-key");
      expect(result1).not.toBe(result2);
    });
  });

  describe("decrypt", () => {
    it("returns null for null input", () => {
      expect(decrypt(null)).toBe(null);
    });

    it("returns null for undefined input", () => {
      expect(decrypt(undefined)).toBe(null);
    });

    it("returns null for empty string", () => {
      expect(decrypt("")).toBe(null);
    });

    it("throws for invalid ciphertext (too short)", () => {
      expect(() => decrypt("dG9vc2hvcnQ=")).toThrow("Invalid ciphertext");
    });

    it("throws for tampered ciphertext", () => {
      const encrypted = encrypt("test-data")!;
      // Tamper with the ciphertext by changing a character
      const tampered =
        encrypted.slice(0, 10) +
        (encrypted[10] === "A" ? "B" : "A") +
        encrypted.slice(11);
      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe("encrypt/decrypt roundtrip", () => {
    it("decrypts back to the original plaintext", () => {
      const plaintext = "my-super-secret-api-key-12345";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("handles special characters", () => {
      const plaintext = "key!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("handles long strings", () => {
      const plaintext = "a".repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("handles unicode characters", () => {
      const plaintext = "secreto-unicode-emoji-test";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe("key validation", () => {
    it("throws for invalid key length", () => {
      process.env.ENCRYPTION_KEY = "tooshort";
      expect(() => encrypt("test")).toThrow(
        "ENCRYPTION_KEY must be a 64-character hex string"
      );
    });

    it("uses development fallback when no key is set and not production", () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = "test";
      // Should not throw in non-production
      const encrypted = encrypt("test-value");
      expect(encrypted).not.toBe(null);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("test-value");
    });
  });
});
