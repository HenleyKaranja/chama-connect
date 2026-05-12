import { useState } from "react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Landmark, Plus, CheckCircle2, Clock, XCircle, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { LoanEligibility } from "@/components/LoanEligibility";
import { logAuditEvent } from "@/lib/auditLog";
import { sanitizeNumber } from "@/lib/sanitize";
import { TransactionPinGate } from "@/components/security/TransactionPinGate";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

const statusColors: Record<string, string> = {
  active: "text-info bg-info/10",
  pending: "text-warning bg-warning/10",
  completed: "text-success bg-success/10",
  rejected: "text-destructive bg-destructive/10",
};

export default function Loans() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [chamaId, setChamaId] = useState("");

  // Repay state
  const [repayOpen, setRepayOpen] = useState(false);
  const [repayLoan, setRepayLoan] = useState<any>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);

  const { data: chamas } = useQuery({
    queryKey: ["chamas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chamas").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: loans, isLoading } = useQuery({
    queryKey: ["loans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("loans").select("*, chamas(name)").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const rl = checkRateLimit(`loanApply:${user!.id}`, RATE_LIMITS.loanApply.max, RATE_LIMITS.loanApply.windowMs);
      if (!rl.allowed) throw new Error(`Too many loan applications. Try again in ${rl.retryInSec}s.`);
      const sanitizedAmount = sanitizeNumber(amount);
      if (isNaN(sanitizedAmount) || sanitizedAmount <= 0) throw new Error("Invalid amount");
      const { error } = await supabase.from("loans").insert({ user_id: user!.id, chama_id: chamaId, amount: sanitizedAmount, status: "pending" });
      if (error) throw error;
      await logAuditEvent("loan_application", "loan", undefined, { chama_id: chamaId, amount: sanitizedAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast.success("Loan application submitted");
      setOpen(false);
      setAmount("");
      setChamaId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const repayMutation = useMutation({
    mutationFn: async () => {
      if (!repayLoan) throw new Error("No loan selected");
      const rl = checkRateLimit(`loanRepay:${user!.id}`, RATE_LIMITS.loanRepay.max, RATE_LIMITS.loanRepay.windowMs);
      if (!rl.allowed) throw new Error(`Too many repayment attempts. Try again in ${rl.retryInSec}s.`);
      const amt = sanitizeNumber(repayAmount);
      if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");
      const balance = Number(repayLoan.amount) - Number(repayLoan.repaid_amount);
      if (amt > balance) throw new Error(`Maximum repayment is KES ${balance.toLocaleString()}`);

      const { data: wallet, error: wErr } = await supabase
        .from("wallets").select("id, balance").eq("user_id", user!.id).limit(1).single();
      if (wErr) throw wErr;
      if (Number(wallet.balance) < amt) throw new Error("Insufficient wallet balance");

      const newRepaid = Number(repayLoan.repaid_amount) + amt;
      const fullyRepaid = newRepaid >= Number(repayLoan.amount);

      const { error: lErr } = await supabase.from("loans").update({
        repaid_amount: newRepaid,
        status: fullyRepaid ? "completed" : "active",
      }).eq("id", repayLoan.id);
      if (lErr) throw lErr;

      const { error: bErr } = await supabase.from("wallets")
        .update({ balance: Number(wallet.balance) - amt })
        .eq("id", wallet.id);
      if (bErr) throw bErr;

      await supabase.from("wallet_transactions").insert({
        user_id: user!.id,
        wallet_id: wallet.id,
        type: "loan_repayment",
        amount: amt,
        description: `Loan repayment · ${repayLoan.chamas?.name ?? "Chama"}`,
      });

      await logAuditEvent("loan_repayment", "loan", repayLoan.id, { amount: amt, fully_repaid: fullyRepaid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Repayment successful");
      setRepayOpen(false);
      setRepayLoan(null);
      setRepayAmount("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalBorrowed = loans?.filter(l => l.status === "active" || l.status === "completed").reduce((s, l) => s + Number(l.amount), 0) ?? 0;
  const outstanding = loans?.filter(l => l.status === "active").reduce((s, l) => s + Number(l.amount) - Number(l.repaid_amount), 0) ?? 0;
  const pendingCount = loans?.filter(l => l.status === "pending").length ?? 0;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Loans</h1>
            <p className="text-muted-foreground mt-1">Manage loan applications and repayments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Apply for Loan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply for a Loan</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Chama</Label>
                  <Select value={chamaId} onValueChange={setChamaId}>
                    <SelectTrigger><SelectValue placeholder="Select chama" /></SelectTrigger>
                    <SelectContent>{chamas?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Loan Eligibility Check */}
                <LoanEligibility chamaId={chamaId} />

                <div>
                  <Label>Amount (KES)</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="25000" />
                </div>
                <Button onClick={() => applyMutation.mutate()} disabled={!chamaId || !amount || applyMutation.isPending} className="w-full">
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Borrowed" value={`KES ${totalBorrowed.toLocaleString()}`} change="Lifetime" icon={Landmark} index={0} />
          <StatCard title="Outstanding" value={`KES ${outstanding.toLocaleString()}`} change={`${loans?.filter(l => l.status === "active").length ?? 0} active`} changeType="neutral" icon={Clock} index={1} />
          <StatCard title="Pending" value={String(pendingCount)} change="Awaiting approval" changeType="neutral" icon={ThumbsUp} index={2} />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : loans?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No loans yet. Apply for your first loan!</div>
          ) : (
            loans?.map((loan, i) => {
              const repaidPct = Number(loan.amount) > 0 ? Math.round((Number(loan.repaid_amount) / Number(loan.amount)) * 100) : 0;
              return (
                <motion.div key={loan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"><Landmark className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{(loan as any).chamas?.name ?? "Chama"}</p>
                          <p className="text-sm text-muted-foreground">KES {Number(loan.amount).toLocaleString()} · {loan.interest_rate}% interest</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[loan.status] ?? statusColors.pending}`}>{loan.status}</span>
                      </div>
                      {loan.status === "active" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Repaid: KES {Number(loan.repaid_amount).toLocaleString()}</span>
                            <span>{repaidPct}%</span>
                          </div>
                          <Progress value={repaidPct} className="h-2" />
                          {loan.due_date && <p className="text-xs text-muted-foreground">Due: {format(new Date(loan.due_date), "MMM d, yyyy")}</p>}
                          <Button size="sm" variant="outline" className="mt-2" onClick={() => { setRepayLoan(loan); setRepayAmount(""); setRepayOpen(true); }}>
                            Repay Loan
                          </Button>
                        </div>
                      )}
                      {loan.status === "completed" && <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" />Fully repaid</p>}
                      {loan.status === "rejected" && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />Rejected · {format(new Date(loan.created_at), "MMM d, yyyy")}</p>
                          {loan.rejection_reason && <p className="text-destructive/80 italic">Reason: {loan.rejection_reason}</p>}
                        </div>
                      )}
                      {loan.status === "pending" && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Applied {format(new Date(loan.created_at), "MMM d, yyyy")} · Awaiting admin approval</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Repay Dialog */}
        <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Repay Loan</DialogTitle></DialogHeader>
            {repayLoan && (
              <div className="space-y-4 pt-2">
                <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Chama</span><span className="font-medium">{repayLoan.chamas?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Loan amount</span><span>KES {Number(repayLoan.amount).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Already repaid</span><span>KES {Number(repayLoan.repaid_amount).toLocaleString()}</span></div>
                  <div className="flex justify-between font-semibold"><span>Outstanding</span><span>KES {(Number(repayLoan.amount) - Number(repayLoan.repaid_amount)).toLocaleString()}</span></div>
                </div>
                <div>
                  <Label>Amount to repay (KES)</Label>
                  <Input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} placeholder="e.g. 5000" />
                  <p className="text-xs text-muted-foreground mt-1">Funds will be deducted from your wallet balance.</p>
                </div>
                <Button onClick={() => setPinOpen(true)} disabled={!repayAmount || repayMutation.isPending} className="w-full">
                  {repayMutation.isPending ? "Processing..." : "Confirm Repayment"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <TransactionPinGate
          open={pinOpen}
          onOpenChange={setPinOpen}
          onVerified={async () => { await repayMutation.mutateAsync(); }}
          title="Authorise Loan Repayment"
          description="Enter your transaction PIN to confirm this repayment."
        />
      </div>
    </AnimatedPage>
  );
}
