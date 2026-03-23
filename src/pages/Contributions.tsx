import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { HandCoins, CheckCircle2, Clock, AlertCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";

const contributions = [
  { id: 1, chama: "Umoja Savings Circle", amount: "KES 5,000", date: "Mar 22, 2026", status: "Paid", method: "M-Pesa" },
  { id: 2, chama: "Maendeleo Investment", amount: "KES 3,000", date: "Mar 20, 2026", status: "Paid", method: "M-Pesa" },
  { id: 3, chama: "Harambee Women's Group", amount: "KES 2,000", date: "Mar 18, 2026", status: "Paid", method: "Bank" },
  { id: 4, chama: "Umoja Savings Circle", amount: "KES 5,000", date: "Feb 22, 2026", status: "Paid", method: "M-Pesa" },
  { id: 5, chama: "Maendeleo Investment", amount: "KES 3,000", date: "Feb 20, 2026", status: "Late", method: "M-Pesa" },
  { id: 6, chama: "Harambee Women's Group", amount: "KES 2,000", date: "Mar 28, 2026", status: "Pending", method: "—" },
];

const statusConfig = {
  Paid: { color: "text-success bg-success/10", icon: CheckCircle2 },
  Pending: { color: "text-warning bg-warning/10", icon: Clock },
  Late: { color: "text-destructive bg-destructive/10", icon: AlertCircle },
};

export default function Contributions() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contributions</h1>
            <p className="text-muted-foreground mt-1">Track your chama contributions</p>
          </div>
          <Button size="sm">
            <HandCoins className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Contributed" value="KES 128,000" change="This year" icon={HandCoins} index={0} />
          <StatCard title="This Month" value="KES 10,000" change="2 of 3 paid" changeType="positive" icon={CheckCircle2} index={1} />
          <StatCard title="Pending" value="KES 2,000" change="Due Mar 28" changeType="neutral" icon={Clock} index={2} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border bg-card shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-sm font-semibold">Payment History</h3>
            <Button variant="ghost" size="sm" className="text-xs">
              <Filter className="h-3 w-3 mr-1" /> Filter
            </Button>
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
                {contributions.map((c) => {
                  const config = statusConfig[c.status as keyof typeof statusConfig];
                  const StatusIcon = config.icon;
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-medium">{c.chama}</td>
                      <td className="p-3 text-sm tabular-nums font-semibold">{c.amount}</td>
                      <td className="p-3 text-sm text-muted-foreground">{c.date}</td>
                      <td className="p-3 text-sm text-muted-foreground">{c.method}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${config.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
