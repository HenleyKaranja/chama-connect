/**
 * Basic form input sanitization utilities.
 * Strips potentially dangerous characters from user inputs.
 */

/** Remove HTML tags */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Sanitize a general text input */
export function sanitizeText(input: string): string {
  return stripHtml(input.trim());
}

/** Sanitize a number input — returns NaN if not a valid number */
export function sanitizeNumber(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned);
}

/** Sanitize an email input */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, "");
}

/** Sanitize a phone input (Kenyan E.164) */
export function sanitizePhone(input: string): string {
  return input.replace(/[^0-9+]/g, "");
}
