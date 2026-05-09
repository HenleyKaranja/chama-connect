import { supabase } from "@/integrations/supabase/client";

const MAX_FAILS = 5;
const WINDOW_MIN = 15;

export async function checkLoginLock(email: string): Promise<{ locked: boolean; minutes: number }> {
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const { data } = await supabase
    .from("login_attempts")
    .select("success, attempted_at")
    .eq("email", email.toLowerCase())
    .gte("attempted_at", since)
    .order("attempted_at", { ascending: false })
    .limit(20);
  if (!data) return { locked: false, minutes: 0 };

  // Count consecutive failures since last success
  let fails = 0;
  for (const row of data) {
    if (row.success) break;
    fails++;
  }
  if (fails >= MAX_FAILS) {
    const oldest = data[Math.min(fails - 1, data.length - 1)];
    const unlockAt = new Date(new Date(oldest.attempted_at).getTime() + WINDOW_MIN * 60_000);
    const minutes = Math.max(1, Math.ceil((unlockAt.getTime() - Date.now()) / 60_000));
    return { locked: true, minutes };
  }
  return { locked: false, minutes: 0 };
}

export async function recordLoginAttempt(email: string, success: boolean) {
  await supabase.from("login_attempts").insert({
    email: email.toLowerCase(),
    success,
    user_agent: navigator.userAgent.slice(0, 255),
  });
}
