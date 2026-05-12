import { useState } from "react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

const WALLET_PRESETS = [
  { name: "Savings Wallet", type: "savings" },
  { name: "Emergency Fund", type: "emergency" },
  { name: "Investment Wallet", type: "investment" },
  { name: "Business Fund", type: "business" },
];

export default function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState("savings");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [txAmount, setTxAmount] = useState("");

  const { data: wallets } = useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user!.id).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["wallet_transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallet_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createWalletMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("wallets").insert({
        user_id: user!.id,
        name: walletName || "Custom Wallet",
        type: walletType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Wallet created!");
      setCreateOpen(false);
      setWalletName("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(txAmount);
      if (!amt || amt <= 0) throw new Error("Invalid amount");
      // Create transaction
      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: selectedWalletId,
        user_id: user!.id,
        type: "deposit",
        amount: amt,
        description: "Manual deposit",
      });
      if (txErr) throw txErr;
      // Update wallet balance
      const wallet = wallets?.find(w => w.id === selectedWalletId);
      if (wallet) {
        const { error } = await supabase.from("wallets").update({
          balance: Number(wallet.balance) + amt,
          total_contributed: Number(wallet.total_contributed) + amt,
        }).eq("id", selectedWalletId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet_transactions"] });
      toast.success("Deposit successful!");
      setDepositOpen(false);
      setTxAmount("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(txAmount);
      if (!amt || amt <= 0) throw new Error("Invalid amount");
      const wallet = wallets?.find(w => w.id === selectedWalletId);
      if (!wallet || Number(wallet.balance) < amt) throw new Error("Insufficient balance");
      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: selectedWalletId,
        user_id: user!.id,
        type: "withdrawal",
        amount: amt,
        description: "Manual withdrawal",
      });
      if (txErr) throw txErr;
      const { error } = await supabase.from("wallets").update({
        balance: Number(wallet.balance) - amt,
        total_withdrawn: Number(wallet.total_withdrawn) + amt,
      }).eq("id", selectedWalletId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet_transactions"] });
      toast.success("Withdrawal successful!");
      setWithdrawOpen(false);
      setTxAmount("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalBalance = wallets?.reduce((s, w) => s + Number(w.balance), 0) ?? 0;
  const totalIn = wallets?.reduce((s, w) => s + Number(w.total_contributed), 0) ?? 0;
  const totalOut = wallets?.reduce((s, w) => s + Number(w.total_withdrawn), 0) ?? 0;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
            <p className="text-muted-foreground mt-1">Manage your wallets</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Wallet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Wallet</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Wallet Name</Label>
                  <Input value={walletName} onChange={e => setWalletName(e.target.value)} placeholder="My Wallet" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={walletType} onValueChange={setWalletType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WALLET_PRESETS.map(p => <SelectItem key={p.type} value={p.type}>{p.name}</SelectItem>)}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => createWalletMutation.mutate()} disabled={createWalletMutation.isPending} className="w-full">
                  {createWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Balance Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl bg-primary p-6 text-primary-foreground shadow-lg">
          <p className="text-sm opacity-80">Total Balance</p>
          <p className="text-4xl font-bold tabular-nums mt-1 tracking-tight">KES {totalBalance.toLocaleString()}</p>
          <p className="text-sm opacity-60 mt-1">{wallets?.length ?? 0} wallet(s)</p>
          <div className="flex gap-3 mt-5">
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="text-xs"><Download className="h-3 w-3 mr-1.5" />Deposit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Deposit to Wallet</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Wallet</Label>
                    <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                      <SelectTrigger><SelectValue placeholder="Select wallet" /></SelectTrigger>
                      <SelectContent>
                        {wallets?.map(w => <SelectItem key={w.id} value={w.id}>{w.name} (KES {Number(w.balance).toLocaleString()})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (KES)</Label>
                    <Input type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="1000" />
                  </div>
                  <Button onClick={() => depositMutation.mutate()} disabled={!selectedWalletId || !txAmount || depositMutation.isPending} className="w-full">
                    {depositMutation.isPending ? "Processing..." : "Deposit"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="text-xs"><Send className="h-3 w-3 mr-1.5" />Withdraw</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Withdraw from Wallet</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Wallet</Label>
                    <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                      <SelectTrigger><SelectValue placeholder="Select wallet" /></SelectTrigger>
                      <SelectContent>
                        {wallets?.map(w => <SelectItem key={w.id} value={w.id}>{w.name} (KES {Number(w.balance).toLocaleString()})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (KES)</Label>
                    <Input type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="1000" />
                  </div>
                  <Button onClick={() => withdrawMutation.mutate()} disabled={!selectedWalletId || !txAmount || withdrawMutation.isPending} className="w-full">
                    {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Money In" value={`KES ${totalIn.toLocaleString()}`} change="Total deposits" changeType="positive" icon={ArrowDownLeft} index={0} />
          <StatCard title="Money Out" value={`KES ${totalOut.toLocaleString()}`} change="Total withdrawals" changeType="negative" icon={ArrowUpRight} index={1} />
          <StatCard title="Net Balance" value={`KES ${totalBalance.toLocaleString()}`} change={totalBalance >= 0 ? "Positive" : "Negative"} changeType={totalBalance >= 0 ? "positive" : "negative"} icon={WalletIcon} index={2} />
        </div>

        {/* Individual Wallets */}
        {wallets && wallets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">{w.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{w.type}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">KES {Number(w.balance).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">In: KES {Number(w.total_contributed).toLocaleString()} · Out: KES {Number(w.total_withdrawn).toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Transaction History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl border bg-card shadow-sm">
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold">Transaction History</h3>
          </div>
          <div className="divide-y">
            {!transactions || transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No transactions yet</div>
            ) : (
              transactions.map((tx) => {
                const isIn = tx.type === "deposit" || tx.type === "credit";
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isIn ? "bg-success/10" : "bg-muted"}`}>
                      {isIn ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description ?? tx.type}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <p className={`text-sm font-semibold tabular-nums ${isIn ? "text-success" : ""}`}>
                      {isIn ? "+" : "-"}KES {Number(tx.amount).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
