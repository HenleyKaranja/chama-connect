import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Landmark, Clock } from "lucide-react";
import { toast } from "sonner";

interface PendingLoan {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  status: string;
  created_at: string;
  chama_id: string;
  member_name?: string;
  chama_name?: string;
}

export function LoanApprovals() {
  const [loans, setLoans] = useState<PendingLoan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingLoans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch member names and chama names
      const userIds = [...new Set(data.map(l => l.user_id))];
      const chamaIds = [...new Set(data.map(l => l.chama_id))];

      const [{ data: profiles }, { data: chamas }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
        supabase.from("chamas").select("id, name").in("id", chamaIds),
      ]);

      const enriched = data.map(loan => ({
        ...loan,
        member_name: profiles?.find(p => p.user_id === loan.user_id)?.full_name || "Unknown",
        chama_name: chamas?.find(c => c.id === loan.chama_id)?.name || "Unknown",
      }));
      setLoans(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPendingLoans(); }, []);

  const handleApprove = async (loan: PendingLoan) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("loans")
      .update({
        status: "active",
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", loan.id);

    if (error) {
      toast.error("Failed to approve loan");
    } else {
      // Notify the member
      await supabase.from("notifications").insert({
        user_id: loan.user_id,
        title: "Loan Approved",
        message: `Your loan of KES ${loan.amount.toLocaleString()} has been approved.`,
        type: "success",
      });
      // Notify chama members
      await supabase.rpc("notify_chama_members", {
        _chama_id: loan.chama_id,
        _title: "Loan Disbursed",
        _message: `${loan.member_name} has been granted a loan of KES ${loan.amount.toLocaleString()} from ${loan.chama_name}.`,
        _type: "info",
        _exclude_user_id: loan.user_id,
      });
      toast.success(`Loan for ${loan.member_name} approved`);
      fetchPendingLoans();
    }
  };

  const handleReject = async (loan: PendingLoan) => {
    const { error } = await supabase.from("loans").update({ status: "rejected" }).eq("id", loan.id);
    if (error) {
      toast.error("Failed to reject loan");
    } else {
      await supabase.from("notifications").insert({
        user_id: loan.user_id,
        title: "Loan Rejected",
        message: `Your loan request of KES ${loan.amount.toLocaleString()} has been rejected.`,
        type: "error",
      });
      toast.success(`Loan for ${loan.member_name} rejected`);
      fetchPendingLoans();
    }
  };

  if (loading) {
    return <div className="rounded-xl border bg-card p-8 text-center"><p className="text-muted-foreground">Loading pending loans...</p></div>;
  }

  if (loans.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-primary mb-3" />
        <h3 className="font-semibold text-lg">No pending loans</h3>
        <p className="text-muted-foreground mt-1">All loan applications have been processed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-5 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Landmark className="h-4 w-4 text-accent" /> Pending Loan Applications ({loans.length})
        </h3>
      </div>
      <div className="divide-y">
        {loans.map((loan) => (
          <div key={loan.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{loan.member_name}</p>
              <p className="text-xs text-muted-foreground">
                KES {loan.amount.toLocaleString()} @ {loan.interest_rate}% • {loan.chama_name}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {new Date(loan.created_at).toLocaleDateString()}
            </Badge>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleApprove(loan)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleReject(loan)}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
