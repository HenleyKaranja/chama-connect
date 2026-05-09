import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function MyPenalties() {
  const { user } = useAuth();
  const { data: penalties = [] } = useQuery({
    queryKey: ["my-penalties", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("penalties")
        .select("*, chamas(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  if (!penalties.length) return null;
  const totalPending = penalties.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/5 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-warning">
          <AlertTriangle className="h-4 w-4" /> Penalties on Your Account
        </div>
        <span className="text-sm font-bold text-warning tabular-nums">KES {totalPending.toLocaleString()} pending</span>
      </div>
      <div className="space-y-2">
        {penalties.slice(0, 5).map((p: any) => (
          <div key={p.id} className="flex items-center justify-between text-sm py-2 border-t first:border-t-0">
            <div className="min-w-0">
              <p className="font-medium truncate">{p.reason}</p>
              <p className="text-xs text-muted-foreground">{(p as any).chamas?.name} · {format(new Date(p.created_at), "MMM d, yyyy")}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-semibold">KES {Number(p.amount).toLocaleString()}</span>
              <Badge variant={p.status === "paid" ? "default" : p.status === "waived" ? "secondary" : "destructive"}>{p.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
