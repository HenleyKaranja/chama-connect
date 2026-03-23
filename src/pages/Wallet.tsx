import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";

const transactions = [
  { id: 1, description: "Contribution - Umoja Savings", amount: "-KES 5,000", date: "Mar 22", type: "out" },
  { id: 2, description: "Loan Repayment Received", amount: "+KES 12,000", date: "Mar 21", type: "in" },
  { id: 3, description: "Contribution - Maendeleo", amount: "-KES 3,000", date: "Mar 20", type: "out" },
  { id: 4, description: "Dividend Payout - Q4", amount: "+KES 8,500", date: "Mar 18", type: "in" },
  { id: 5, description: "Contribution - Harambee", amount: "-KES 2,000", date: "Mar 18", type: "out" },
  { id: 6, description: "M-Pesa Top-up", amount: "+KES 20,000", date: "Mar 15", type: "in" },
  { id: 7, description: "Loan Disbursement", amount: "-KES 25,000", date: "Mar 12", type: "out" },
  { id: 8, description: "Investment Return", amount: "+KES 3,200", date: "Mar 10", type: "in" },
];

export default function WalletPage() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground mt-1">Your financial overview</p>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl bg-primary p-6 text-primary-foreground shadow-lg"
        >
          <p className="text-sm opacity-80">Available Balance</p>
          <p className="text-4xl font-bold tabular-nums mt-1 tracking-tight">KES 87,200</p>
          <p className="text-sm opacity-60 mt-1">Across all chama wallets</p>
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
          <StatCard title="Money In" value="KES 43,700" change="This month" changeType="positive" icon={ArrowDownLeft} index={0} />
          <StatCard title="Money Out" value="KES 35,000" change="This month" changeType="negative" icon={ArrowUpRight} index={1} />
          <StatCard title="Net Flow" value="+KES 8,700" change="Positive trend" changeType="positive" icon={WalletIcon} index={2} />
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
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tx.type === "in" ? "bg-success/10" : "bg-muted"}`}>
                  {tx.type === "in" ? (
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <p className={`text-sm font-semibold tabular-nums ${tx.type === "in" ? "text-success" : ""}`}>
                  {tx.amount}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
