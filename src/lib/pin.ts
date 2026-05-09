// Simple SHA-256 hash of PIN with per-user salt (user_id) for transaction PIN.
// NOT a substitute for Supabase auth — adds an extra confirmation step for money actions.
export async function hashPin(userId: string, pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${userId}:${pin}:m-chama-pin-v1`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isValidPin(pin: string) {
  return /^\d{4,6}$/.test(pin);
}
