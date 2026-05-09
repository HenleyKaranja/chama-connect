import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "mchama.session.id";

function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS device";
  if (/android/i.test(ua)) return "Android device";
  if (/mac/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows PC";
  if (/linux/i.test(ua)) return "Linux";
  return "Web browser";
}

export function useSessionTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let sessionId = localStorage.getItem(SESSION_KEY);

    (async () => {
      if (!sessionId) {
        const { data, error } = await supabase.from("user_sessions").insert({
          user_id: user.id,
          device_label: deviceLabel(),
          user_agent: navigator.userAgent.slice(0, 255),
        }).select("id").single();
        if (!error && data && !cancelled) {
          sessionId = data.id;
          localStorage.setItem(SESSION_KEY, data.id);
        }
      } else {
        // touch last_seen_at
        await supabase.from("user_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", sessionId);
      }
    })();

    const interval = setInterval(() => {
      if (sessionId) {
        supabase.from("user_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", sessionId);
      }
    }, 60_000);

    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);
}
