import { useState } from "react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { HandCoins, CheckCircle2, Clock, AlertCircle, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

const statusConfig = {
  paid: { color: "text-success bg-success/10", icon: CheckCircle2, label: "Paid" },
  pending: { color: "text-warning bg-warning/10", icon: Clock, label: "Pending" },
  late: { color: "text-destructive bg-destructive/10", icon: AlertCircle, label: "Late" },
};

export default function Contributions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [chamaId, setChamaId] = useState("");
  const [method, setMethod] = useState("mpesa");
  const [notes, setNotes] = useState("");
  const { data: chamas } = useQuery({
    queryKey: ["chamas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chamas").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["contributions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("*, chamas(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contributions").insert({
        user_id: user!.id,
        chama_id: chamaId,
        amount: parseFloat(amount),
        payment_method: method,
        notes: notes || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      toast.success("Contribution submitted successfully");
      setOpen(false);
      setAmount("");
      setChamaId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalContributed = contributions?.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;
  const pendingAmount = contributions?.filter(c => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;
  const thisMonthPaid = contributions?.filter(c => c.status === "paid" && new Date(c.created_at).getMonth() === new Date().getMonth()).length ?? 0;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contributions</h1>
            <p className="text-muted-foreground mt-1">Track your chama contributions</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <HandCoins className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make a Contribution</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Chama</Label>
                  <Select value={chamaId} onValueChange={setChamaId}>
                    <SelectTrigger><SelectValue placeholder="Select chama" /></SelectTrigger>
                    <SelectContent>
                      {chamas?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (KES)</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000" />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {method === "cash" && (
                  <div>
                    <Label>Notes / Description</Label>
                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Paid cash to treasurer at meeting" />
                    <p className="text-xs text-muted-foreground mt-1">Cash payments require admin verification</p>
                  </div>
                )}
                <Button onClick={() => createMutation.mutate()} disabled={!chamaId || !amount || createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Submitting..." : method === "cash" ? "Submit for Approval" : "Submit Payment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Contributed" value={`KES ${totalContributed.toLocaleString()}`} change="All time" icon={HandCoins} index={0} />
          <StatCard title="This Month" value={`${thisMonthPaid} paid`} change="Contributions" changeType="positive" icon={CheckCircle2} index={1} />
          <StatCard title="Pending" value={`KES ${pendingAmount.toLocaleString()}`} change="Awaiting confirmation" changeType="neutral" icon={Clock} index={2} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border bg-card shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-sm font-semibold">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Chama</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Method</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : contributions?.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No contributions yet. Make your first payment!</td></tr>
                ) : (
                  contributions?.map((c) => {
                    const config = statusConfig[c.status as keyof typeof statusConfig] ?? statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-sm font-medium">{(c as any).chamas?.name ?? "—"}</td>
                        <td className="p-3 text-sm tabular-nums font-semibold">KES {Number(c.amount).toLocaleString()}</td>
                        <td className="p-3 text-sm text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</td>
                        <td className="p-3 text-sm text-muted-foreground capitalize">{c.payment_method ?? "—"}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${config.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
