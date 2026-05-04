import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Banknote, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function PaymentApprovals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["admin-contributions", filter],
    queryFn: async () => {
      let query = supabase
        .from("contributions")
        .select("*, chamas(name), profiles!contributions_user_id_fkey(full_name, phone)")
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("status", "pending");
      }

      const { data, error } = await query;
      if (error) {
        // Fallback without foreign key hint
        const { data: fallback, error: err2 } = await supabase
          .from("contributions")
          .select("*, chamas(name)")
          .order("created_at", { ascending: false })
          .eq(filter === "pending" ? "status" : "id", filter === "pending" ? "pending" : undefined as any);
        if (err2) throw err2;
        return fallback;
      }
      return data;
    },
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      const { error } = await supabase
        .from("contributions")
        .update({
          status: "paid",
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", contributionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      toast.success("Payment approved successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      const { error } = await supabase
        .from("contributions")
        .update({ status: "late" })
        .eq("id", contributionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      toast.success("Payment rejected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pendingCount = contributions?.filter(c => c.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Payment Verification</h2>
          <p className="text-sm text-muted-foreground">Review and approve cash-in-hand and manual payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>
            <Clock className="h-4 w-4 mr-1" /> Pending ({pendingCount})
          </Button>
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All Payments
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-xl border bg-card shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Member</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Chama</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Method</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Notes</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : contributions?.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No payments to review</td></tr>
              ) : (
                contributions?.map((c: any) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-sm font-medium">{c.profiles?.full_name ?? "Unknown"}</td>
                    <td className="p-3 text-sm">{c.chamas?.name ?? "—"}</td>
                    <td className="p-3 text-sm tabular-nums font-semibold">KES {Number(c.amount).toLocaleString()}</td>
                    <td className="p-3 text-sm capitalize">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        c.payment_method === "cash" ? "text-amber-700 bg-amber-100" : "text-muted-foreground bg-muted"
                      }`}>
                        {c.payment_method === "cash" && <Banknote className="h-3 w-3" />}
                        {c.payment_method ?? "—"}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">{c.notes ?? "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        c.status === "paid" ? "text-success bg-success/10" :
                        c.status === "pending" ? "text-warning bg-warning/10" :
                        "text-destructive bg-destructive/10"
                      }`}>
                        {c.status === "paid" ? "Approved" : c.status === "pending" ? "Pending" : "Rejected"}
                      </span>
                    </td>
                    <td className="p-3">
                      {c.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-success border-success/30 hover:bg-success/10"
                            onClick={() => approveMutation.mutate(c.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => rejectMutation.mutate(c.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                      {c.status === "paid" && c.approved_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(c.approved_at), "MMM d")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
