import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate, maskCredential, redactAccountCredentials } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("merges tailwind classes correctly", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    });
  });

  describe("formatCurrency", () => {
    it("formats positive amounts", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("formats negative amounts", () => {
      expect(formatCurrency(-500)).toBe("-$500.00");
    });

    it("formats zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });
  });

  describe("formatDate", () => {
    it("formats dates with default pattern", () => {
      const result = formatDate("2024-01-15");
      expect(result).toBe("Jan 15, 2024");
    });

    it("formats dates with custom pattern", () => {
      const result = formatDate("2024-03-20", "yyyy-MM-dd");
      expect(result).toBe("2024-03-20");
    });
  });

  describe("maskCredential", () => {
    it("returns null for null input", () => {
      expect(maskCredential(null)).toBe(null);
    });

    it("returns null for undefined input", () => {
      expect(maskCredential(undefined)).toBe(null);
    });

    it("returns null for empty string", () => {
      expect(maskCredential("")).toBe(null);
    });

    it("masks short credentials (4 chars or less) entirely", () => {
      expect(maskCredential("abcd")).toBe("****");
      expect(maskCredential("ab")).toBe("****");
    });

    it("shows only last 4 characters for longer credentials", () => {
      expect(maskCredential("mysecretapikey1234")).toBe("****1234");
    });

    it("shows last 4 chars for exactly 5 char credential", () => {
      expect(maskCredential("12345")).toBe("****2345");
    });
  });

  describe("redactAccountCredentials", () => {
    it("removes apiKey and apiSecret from the object", () => {
      const account = {
        id: "acc-1",
        name: "Test Account",
        platform: "TRADOVATE",
        apiKey: "secretkey123",
        apiSecret: "secretsecret456",
        balance: 10000,
      };

      const redacted = redactAccountCredentials(account);
      expect(redacted).toEqual({
        id: "acc-1",
        name: "Test Account",
        platform: "TRADOVATE",
        balance: 10000,
      });
      expect("apiKey" in redacted).toBe(false);
      expect("apiSecret" in redacted).toBe(false);
    });

    it("handles null credential values", () => {
      const account = {
        id: "acc-1",
        name: "Test",
        apiKey: null,
        apiSecret: null,
      };

      const redacted = redactAccountCredentials(account);
      expect(redacted).toEqual({ id: "acc-1", name: "Test" });
    });

    it("preserves all other fields", () => {
      const account = {
        id: "acc-1",
        name: "Account",
        platform: "TRADOVATE",
        accountId: "123",
        apiKey: "key",
        apiSecret: "secret",
        balance: 5000,
        status: "active",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      };

      const redacted = redactAccountCredentials(account);
      expect(redacted.id).toBe("acc-1");
      expect(redacted.name).toBe("Account");
      expect(redacted.platform).toBe("TRADOVATE");
      expect(redacted.accountId).toBe("123");
      expect(redacted.balance).toBe(5000);
      expect(redacted.status).toBe("active");
    });
  });
});
