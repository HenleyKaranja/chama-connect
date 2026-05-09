import { Smartphone, Monitor, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";

export function ActiveSessions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ["user_sessions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .is("revoked_at", null)
        .order("last_seen_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await logAuditEvent("session_revoked", "security", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_sessions"] });
      toast.success("Device session revoked");
    },
  });

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Smartphone className="h-4 w-4" /> Active Devices
      </div>
      <p className="text-xs text-muted-foreground">Devices currently signed into your account. Revoke any you don't recognise.</p>
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No tracked sessions yet.</p>
        ) : sessions.map((s: any) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.device_label || "Unknown device"}</p>
              <p className="text-xs text-muted-foreground truncate">
                Last active {new Date(s.last_seen_at).toLocaleString("en-KE")}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => revoke.mutate(s.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
