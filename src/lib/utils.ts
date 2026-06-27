import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string, pattern = "MMM dd, yyyy"): string {
  return format(new Date(date), pattern);
}

/**
 * Masks a credential string for display purposes.
 * Shows only the last 4 characters, replacing the rest with asterisks.
 * Returns null if the input is null/undefined/empty.
 */
export function maskCredential(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return "****";
  return "****" + value.slice(-4);
}

/**
 * Strips sensitive credential fields (apiKey, apiSecret) from an account object.
 * Returns a new object without those fields.
 */
export function redactAccountCredentials<
  T extends { apiKey?: string | null; apiSecret?: string | null },
>(account: T): Omit<T, "apiKey" | "apiSecret"> {
  const { apiKey: _apiKey, apiSecret: _apiSecret, ...rest } = account;
  return rest;
}
