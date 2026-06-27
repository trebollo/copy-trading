import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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
});
