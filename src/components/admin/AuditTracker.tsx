import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Shield, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AuditTracker() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["all_profiles_for_audit"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
  });

  const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);

  const filteredLogs = logs?.filter((log) => {
    const matchSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (nameMap.get(log.user_id) ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (log.entity_type ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const actions = [...new Set(logs?.map((l) => l.action) ?? [])];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Audit Trail</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Details</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading audit logs...</td></tr>
              ) : filteredLogs?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No audit events found</td></tr>
              ) : (
                filteredLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{nameMap.get(log.user_id) ?? "Unknown"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.entity_type ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {log.details && Object.keys(log.details as object).length > 0
                        ? JSON.stringify(log.details)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
