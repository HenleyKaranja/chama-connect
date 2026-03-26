import { useEffect, useState } from "react";
import { Wallet, Users, HandCoins, TrendingUp, Landmark, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const contributionData = [
  { month: "Aug", amount: 45000 },
  { month: "Sep", amount: 52000 },
  { month: "Oct", amount: 48000 },
  { month: "Nov", amount: 61000 },
  { month: "Dec", amount: 55000 },
  { month: "Jan", amount: 67000 },
  { month: "Feb", amount: 72000 },
  { month: "Mar", amount: 78000 },
];

const loanData = [
  { month: "Aug", disbursed: 30000, repaid: 25000 },
  { month: "Sep", disbursed: 15000, repaid: 32000 },
  { month: "Oct", disbursed: 45000, repaid: 28000 },
  { month: "Nov", disbursed: 20000, repaid: 40000 },
  { month: "Dec", disbursed: 35000, repaid: 35000 },
  { month: "Jan", disbursed: 25000, repaid: 42000 },
  { month: "Feb", disbursed: 10000, repaid: 38000 },
  { month: "Mar", disbursed: 40000, repaid: 45000 },
];

interface RecentTransaction {
  id: string;
  member: string;
  type: string;
  amount: string;
  date: string;
  avatar: string;
  positive: boolean;
}

const upcomingEvents = [
  { title: "Monthly contribution due", date: "Mar 28", type: "contribution" },
  { title: "Loan vote: Peter's request", date: "Mar 25", type: "vote" },
  { title: "Quarterly meeting", date: "Apr 1", type: "meeting" },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);

  useEffect(() => {
    async function fetchRecentTransactions() {
      if (!user) return;

      // Fetch recent contributions and loans
      const [{ data: contributions }, { data: loans }] = await Promise.all([
        supabase.from("contributions").select("id, user_id, amount, status, created_at, chama_id").order("created_at", { ascending: false }).limit(10),
        supabase.from("loans").select("id, user_id, amount, status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      // Get user profiles for names
      const allUserIds = [
        ...(contributions?.map(c => c.user_id) ?? []),
        ...(loans?.map(l => l.user_id) ?? []),
      ];
      const uniqueIds = [...new Set(allUserIds)];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", uniqueIds);

      const getName = (uid: string) => profiles?.find(p => p.user_id === uid)?.full_name || "Unknown";
      const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

      const txList: RecentTransaction[] = [];

      contributions?.forEach(c => {
        const name = getName(c.user_id);
        txList.push({
          id: c.id,
          member: name,
          type: "Contribution",
          amount: `+KES ${Number(c.amount).toLocaleString()}`,
          date: new Date(c.created_at).toLocaleDateString(),
          avatar: getInitials(name),
          positive: true,
        });
      });

      loans?.forEach(l => {
        const name = getName(l.user_id);
        const isRepayment = l.status === "completed";
        txList.push({
          id: l.id,
          member: name,
          type: isRepayment ? "Loan Repaid" : l.status === "active" ? "Loan Disbursed" : "Loan " + l.status,
          amount: `${isRepayment ? "+" : "-"}KES ${Number(l.amount).toLocaleString()}`,
          date: new Date(l.created_at).toLocaleDateString(),
          avatar: getInitials(name),
          positive: isRepayment,
        });
      });

      // Sort by date and take 10
      txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txList.slice(0, 10));
    }

    fetchRecentTransactions();
  }, [user]);

  const firstName = profile?.full_name?.split(" ")[0] || "Member";

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habari, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your chamas today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Balance" value="KES 478,200" change="+12.3% from last month" changeType="positive" icon={Wallet} index={0} />
          <StatCard title="My Chamas" value="3" change="2 active contributions" changeType="neutral" icon={Users} index={1} />
          <StatCard title="This Month" value="KES 15,000" change="All contributions paid" changeType="positive" icon={HandCoins} index={2} />
          <StatCard title="Active Loans" value="KES 25,000" change="1 pending approval" changeType="neutral" icon={Landmark} index={3} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold mb-4">Contribution Trend</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contributionData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152, 45%, 28%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(152, 45%, 28%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 89%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(40, 15%, 89%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Amount"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(152, 45%, 28%)" strokeWidth={2} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold mb-4">Loans Overview</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 89%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(40, 15%, 89%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`]}
                  />
                  <Bar dataKey="disbursed" fill="hsl(38, 85%, 55%)" radius={[4, 4, 0, 0]} name="Disbursed" />
                  <Bar dataKey="repaid" fill="hsl(152, 45%, 28%)" radius={[4, 4, 0, 0]} name="Repaid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border bg-card shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b">
            <h3 className="text-sm font-semibold">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No recent transactions</td></tr>
                ) : transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {tx.avatar}
                        </div>
                        <span className="font-medium">{tx.member}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.type}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${tx.positive ? "text-primary" : "text-destructive"}`}>
                      {tx.amount}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border bg-card p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold mb-4">Upcoming</h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  event.type === "contribution" ? "bg-primary" : event.type === "vote" ? "bg-accent" : "bg-info"
                }`} />
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
