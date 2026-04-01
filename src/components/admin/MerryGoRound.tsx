import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CycleRow {
  id: string;
  cycle_number: number;
  amount: number;
  payout_date: string;
  status: string;
  recipient_user_id: string;
  chama_id: string;
  profiles?: { full_name: string } | null;
  chamas?: { name: string } | null;
}

export function MerryGoRound() {
  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["merry-go-round-cycles"],
    queryFn: async () => {
      // Use raw query to join profiles table since recipient_user_id isn't a FK to profiles
      const { data, error } = await supabase
        .from("merry_go_round_cycles")
        .select("*")
        .order("cycle_number", { ascending: true });

      if (error) throw error;

      // Fetch recipient names
      const userIds = [...new Set((data || []).map((c: any) => c.recipient_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      return (data || []).map((c: any) => ({
        ...c,
        recipient_name: profileMap.get(c.recipient_user_id) || "Unknown Member",
      }));
    },
  });

  const currentCycle = cycles.find((c: any) => c.status === "current");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <RefreshCw className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p>No merry-go-round cycles configured yet.</p>
        <p className="text-xs mt-1">Admins can set up rotation cycles for each chama.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentCycle && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Current Cycle #{currentCycle.cycle_number}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Recipient</p>
              <p className="font-semibold">{currentCycle.recipient_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold">KES {Number(currentCycle.amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payout Date</p>
              <p className="font-semibold">{new Date(currentCycle.payout_date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-5 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> All Cycles
          </h3>
        </div>
        <div className="divide-y">
          {cycles.map((cycle: any, i: number) => (
            <div
              key={cycle.id}
              className={`flex items-center gap-4 p-4 transition-colors ${
                cycle.status === "current" ? "bg-primary/5" : "hover:bg-muted/30"
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                cycle.status === "completed"
                  ? "bg-primary/10 text-primary"
                  : cycle.status === "current"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {cycle.cycle_number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cycle.recipient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(cycle.payout_date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">KES {Number(cycle.amount).toLocaleString()}</p>
              <Badge
                variant={
                  cycle.status === "completed" ? "default" :
                  cycle.status === "current" ? "secondary" : "outline"
                }
                className="text-xs capitalize"
              >
                {cycle.status}
              </Badge>
              {i < cycles.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
