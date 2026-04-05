import { useEffect, useState, useMemo } from "react";
import { Wallet, Users, HandCoins, Landmark } from "lucide-react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth } from "date-fns";

interface RecentTransaction {
  id: string;
  member: string;
  type: string;
  amount: string;
  date: string;
  avatar: string;
  positive: boolean;
}

export default function Dashboard() {
  const { user, profile } = useAuth();

  // Wallet balance
  const { data: wallets } = useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance, total_contributed, total_withdrawn").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Chamas joined
  const { data: memberships } = useQuery({
    queryKey: ["chama_members", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("chama_members").select("chama_id, status").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  // My contributions
  const { data: contributions } = useQuery({
    queryKey: ["my_contributions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("contributions").select("id, amount, status, created_at, chama_id, user_id").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // My loans
  const { data: loans } = useQuery({
    queryKey: ["my_loans", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("id, amount, status, repaid_amount, created_at, user_id").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // My wallet transactions
  const { data: walletTxs } = useQuery({
    queryKey: ["my_wallet_transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallet_transactions").select("id, amount, type, description, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
    enabled: !!user,
  });

  // My investment contributions
  const { data: investmentTxs } = useQuery({
    queryKey: ["my_investment_txs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("investment_contributions").select("id, amount, payment_method, notes, created_at, project_id").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Compute stats
  const totalBalance = wallets?.reduce((s, w) => s + Number(w.balance), 0) ?? 0;
  const chamasJoined = memberships?.filter(m => m.status === "active").length ?? 0;
  const now = new Date();
  const thisMonthContributions = contributions?.filter(c => c.status === "paid" && new Date(c.created_at).getMonth() === now.getMonth() && new Date(c.created_at).getFullYear() === now.getFullYear()).reduce((s, c) => s + Number(c.amount), 0) ?? 0;
  const activeLoansTotal = loans?.filter(l => l.status === "active").reduce((s, l) => s + Number(l.amount) - Number(l.repaid_amount), 0) ?? 0;
  const pendingLoans = loans?.filter(l => l.status === "pending").length ?? 0;

  // Build chart data from real contributions (last 8 months)
  const contributionChartData = useMemo(() => {
    const months: { month: string; amount: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const label = format(d, "MMM");
      const total = contributions?.filter(c => c.status === "paid" && new Date(c.created_at) >= start && new Date(c.created_at).getMonth() === d.getMonth() && new Date(c.created_at).getFullYear() === d.getFullYear()).reduce((s, c) => s + Number(c.amount), 0) ?? 0;
      months.push({ month: label, amount: total });
    }
    return months;
  }, [contributions]);

  const loanChartData = useMemo(() => {
    const months: { month: string; disbursed: number; repaid: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = subMonths(now, i);
      const label = format(d, "MMM");
      const monthLoans = loans?.filter(l => new Date(l.created_at).getMonth() === d.getMonth() && new Date(l.created_at).getFullYear() === d.getFullYear()) ?? [];
      const disbursed = monthLoans.filter(l => l.status === "active" || l.status === "completed").reduce((s, l) => s + Number(l.amount), 0);
      const repaid = monthLoans.reduce((s, l) => s + Number(l.repaid_amount), 0);
      months.push({ month: label, disbursed, repaid });
    }
    return months;
  }, [loans]);

  // Recent transactions
  const transactions = useMemo(() => {
    const txList: RecentTransaction[] = [];
    const getName = () => profile?.full_name || "You";
    const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    contributions?.slice(0, 10).forEach(c => {
      txList.push({
        id: c.id,
        member: getName(),
        type: "Contribution",
        amount: `+KES ${Number(c.amount).toLocaleString()}`,
        date: format(new Date(c.created_at), "MMM d, yyyy"),
        avatar: getInitials(getName()),
        positive: true,
      });
    });

    loans?.slice(0, 10).forEach(l => {
      const isRepaid = l.status === "completed";
      txList.push({
        id: l.id,
        member: getName(),
        type: isRepaid ? "Loan Repaid" : l.status === "active" ? "Loan Disbursed" : `Loan ${l.status}`,
        amount: `${isRepaid ? "+" : "-"}KES ${Number(l.amount).toLocaleString()}`,
        date: format(new Date(l.created_at), "MMM d, yyyy"),
        avatar: getInitials(getName()),
        positive: isRepaid,
      });
    });

    txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return txList.slice(0, 10);
  }, [contributions, loans, profile]);

  const firstName = profile?.full_name?.split(" ")[0] || "Member";

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habari, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your chamas today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Balance" value={`KES ${totalBalance.toLocaleString()}`} change="Across all wallets" changeType="positive" icon={Wallet} index={0} />
          <StatCard title="My Chamas" value={String(chamasJoined)} change={`${memberships?.length ?? 0} total memberships`} changeType="neutral" icon={Users} index={1} />
          <StatCard title="This Month" value={`KES ${thisMonthContributions.toLocaleString()}`} change="Paid contributions" changeType="positive" icon={HandCoins} index={2} />
          <StatCard title="Active Loans" value={`KES ${activeLoansTotal.toLocaleString()}`} change={pendingLoans > 0 ? `${pendingLoans} pending approval` : "No pending"} changeType="neutral" icon={Landmark} index={3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">My Contribution Trend</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contributionChartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Amount"]} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">My Loans Overview</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`]} />
                  <Bar dataKey="disbursed" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Disbursed" />
                  <Bar dataKey="repaid" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Repaid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="text-sm font-semibold">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No recent transactions</td></tr>
                ) : transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{tx.avatar}</div>
                        <span className="font-medium">{tx.type}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${tx.positive ? "text-success" : "text-destructive"}`}>{tx.amount}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
