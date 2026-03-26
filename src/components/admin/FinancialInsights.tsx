import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target, Activity } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["hsl(152, 45%, 28%)", "hsl(38, 85%, 55%)", "hsl(200, 70%, 50%)", "hsl(0, 72%, 51%)"];

export function FinancialInsights() {
  const [insights, setInsights] = useState({
    totalContributions: 0,
    totalLoansOut: 0,
    totalRepaid: 0,
    interestEarned: 0,
    avgLoanSize: 0,
    collectionRate: 0,
    loanUtilization: 0,
    portfolioHealth: [] as { name: string; value: number }[],
  });

  useEffect(() => {
    async function fetch() {
      const [{ data: contributions }, { data: loans }] = await Promise.all([
        supabase.from("contributions").select("amount, status"),
        supabase.from("loans").select("amount, status, repaid_amount, interest_rate"),
      ]);

      const totalContributions = contributions?.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0) ?? 0;
      const paidContributions = contributions?.filter(c => c.status === "paid").length ?? 0;
      const totalContributionsCount = contributions?.length ?? 1;

      const activeLoans = loans?.filter(l => ["active", "completed"].includes(l.status)) ?? [];
      const totalLoansOut = activeLoans.reduce((s, l) => s + Number(l.amount), 0);
      const totalRepaid = loans?.reduce((s, l) => s + Number(l.repaid_amount), 0) ?? 0;
      const interestEarned = activeLoans.reduce((s, l) => s + (Number(l.amount) * Number(l.interest_rate) / 100), 0);
      const avgLoanSize = activeLoans.length > 0 ? totalLoansOut / activeLoans.length : 0;

      const pending = loans?.filter(l => l.status === "pending").length ?? 0;
      const active = loans?.filter(l => l.status === "active").length ?? 0;
      const completed = loans?.filter(l => l.status === "completed").length ?? 0;
      const defaulted = loans?.filter(l => l.status === "defaulted").length ?? 0;

      setInsights({
        totalContributions,
        totalLoansOut,
        totalRepaid,
        interestEarned: Math.round(interestEarned),
        avgLoanSize: Math.round(avgLoanSize),
        collectionRate: Math.round((paidContributions / totalContributionsCount) * 100),
        loanUtilization: totalContributions > 0 ? Math.round((totalLoansOut / totalContributions) * 100) : 0,
        portfolioHealth: [
          { name: "Active", value: active },
          { name: "Completed", value: completed },
          { name: "Pending", value: pending },
          { name: "Defaulted", value: defaulted },
        ].filter(i => i.value > 0),
      });
    }
    fetch();
  }, []);

  const cards = [
    { label: "Total Contributions", value: `KES ${insights.totalContributions.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: "Outstanding Loans", value: `KES ${insights.totalLoansOut.toLocaleString()}`, icon: TrendingDown, color: "text-accent" },
    { label: "Total Repaid", value: `KES ${insights.totalRepaid.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
    { label: "Interest Earned", value: `KES ${insights.interestEarned.toLocaleString()}`, icon: Activity, color: "text-accent" },
    { label: "Avg Loan Size", value: `KES ${insights.avgLoanSize.toLocaleString()}`, icon: Target, color: "text-muted-foreground" },
    { label: "Collection Rate", value: `${insights.collectionRate}%`, icon: PieChart, color: insights.collectionRate >= 80 ? "text-primary" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Loan Portfolio Health</h3>
          {insights.portfolioHealth.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={insights.portfolioHealth} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {insights.portfolioHealth.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No loan data yet</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Key Ratios</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Loan Utilization</span>
                <span className="font-medium">{insights.loanUtilization}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(insights.loanUtilization, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Collection Rate</span>
                <span className="font-medium">{insights.collectionRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(insights.collectionRate, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Repayment Progress</span>
                <span className="font-medium">{insights.totalLoansOut > 0 ? Math.round((insights.totalRepaid / insights.totalLoansOut) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${insights.totalLoansOut > 0 ? Math.min((insights.totalRepaid / insights.totalLoansOut) * 100, 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
