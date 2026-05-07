import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Activity } from "lucide-react";

export function ActivityLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity_logs_recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles_for_activity"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
  });

  const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);

  const getActionColor = (action: string) => {
    if (action.includes("login")) return "bg-info/10 text-info";
    if (action.includes("logout")) return "bg-warning/10 text-warning";
    if (action.includes("approve")) return "bg-success/10 text-success";
    if (action.includes("reject")) return "bg-destructive/10 text-destructive";
    return "bg-primary/10 text-primary";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Activity Feed</h3>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading activity...</p>
        ) : logs?.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No activity recorded yet</p>
        ) : (
          logs?.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                {(nameMap.get(log.user_id) ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{nameMap.get(log.user_id) ?? "Unknown"}</span>{" "}
                  <span className="text-muted-foreground">{log.action.replace(/_/g, " ")}</span>
                  {log.entity_type && (
                    <span className="text-muted-foreground"> on {log.entity_type}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(log.created_at), "MMM d, yyyy 'at' HH:mm")}
                </p>
              </div>
              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                {log.action.replace(/_/g, " ")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
