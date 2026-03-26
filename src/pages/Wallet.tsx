import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function WalletPage() {
  const { user } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["wallet_transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const balance = Number(wallet?.balance ?? 0);
  const totalIn = Number(wallet?.total_contributed ?? 0);
  const totalOut = Number(wallet?.total_withdrawn ?? 0);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground mt-1">Your financial overview</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl bg-primary p-6 text-primary-foreground shadow-lg"
        >
          <p className="text-sm opacity-80">Available Balance</p>
          <p className="text-4xl font-bold tabular-nums mt-1 tracking-tight">KES {balance.toLocaleString()}</p>
          <p className="text-sm opacity-60 mt-1">Your chama wallet</p>
          <div className="flex gap-3 mt-5">
            <Button size="sm" variant="secondary" className="text-xs">
              <Send className="h-3 w-3 mr-1.5" /> Send
            </Button>
            <Button size="sm" variant="secondary" className="text-xs">
              <Download className="h-3 w-3 mr-1.5" /> Deposit
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Money In" value={`KES ${totalIn.toLocaleString()}`} change="Total deposits" changeType="positive" icon={ArrowDownLeft} index={0} />
          <StatCard title="Money Out" value={`KES ${totalOut.toLocaleString()}`} change="Total withdrawals" changeType="negative" icon={ArrowUpRight} index={1} />
          <StatCard title="Net Balance" value={`KES ${balance.toLocaleString()}`} change={balance >= 0 ? "Positive" : "Negative"} changeType={balance >= 0 ? "positive" : "negative"} icon={WalletIcon} index={2} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border bg-card shadow-sm"
        >
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
                      {isIn ? (
                        <ArrowDownLeft className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description ?? tx.type}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "MMM d")}</p>
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
