import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE = 2 * 60 * 1000; // warn 2 min before

export function useAutoLogout() {
  const { user, signOut } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    if (!user) return;
    clearTimeout(timerRef.current);
    clearTimeout(warningRef.current);

    warningRef.current = setTimeout(() => {
      toast.warning("You will be logged out in 2 minutes due to inactivity.");
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    timerRef.current = setTimeout(() => {
      toast.info("Logged out due to inactivity.");
      signOut();
    }, IDLE_TIMEOUT);
  }, [user, signOut]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timerRef.current);
      clearTimeout(warningRef.current);
    };
  }, [user, resetTimer]);
}
