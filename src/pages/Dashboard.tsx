import { Wallet, Users, HandCoins, TrendingUp, Landmark, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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

const recentTransactions = [
  { id: 1, member: "Grace Muthoni", type: "Contribution", amount: "+KES 5,000", date: "Today", avatar: "GM" },
  { id: 2, member: "Peter Ochieng", type: "Loan Repayment", amount: "+KES 12,000", date: "Today", avatar: "PO" },
  { id: 3, member: "Faith Akinyi", type: "Loan Disbursed", amount: "-KES 25,000", date: "Yesterday", avatar: "FA" },
  { id: 4, member: "James Kamau", type: "Contribution", amount: "+KES 5,000", date: "Yesterday", avatar: "JK" },
  { id: 5, member: "Mary Njeri", type: "Contribution", amount: "+KES 5,000", date: "Mar 20", avatar: "MN" },
];

const upcomingEvents = [
  { title: "Monthly contribution due", date: "Mar 28", type: "contribution" },
  { title: "Loan vote: Peter's request", date: "Mar 25", type: "vote" },
  { title: "Quarterly meeting", date: "Apr 1", type: "meeting" },
];

export default function Dashboard() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habari, Amina 👋</h1>
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

        {/* Transactions + Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {tx.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.member}</p>
                    <p className="text-xs text-muted-foreground">{tx.type}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${tx.amount.startsWith("+") ? "text-success" : "text-destructive"}`}>
                      {tx.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

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
      </div>
    </AnimatedPage>
  );
}
