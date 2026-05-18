import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { SEO } from "@/components/SEO";

const pieData = [
  { name: "Contributions", value: 478200, color: "hsl(152, 45%, 28%)" },
  { name: "Loans Outstanding", value: 85000, color: "hsl(38, 85%, 55%)" },
  { name: "Investments", value: 330000, color: "hsl(205, 78%, 52%)" },
  { name: "Expenses", value: 12500, color: "hsl(340, 65%, 55%)" },
];

const monthlyData = [
  { month: "Oct", contributions: 48000, loans: 15000, investments: 10000 },
  { month: "Nov", contributions: 61000, loans: 20000, investments: 25000 },
  { month: "Dec", contributions: 55000, loans: 35000, investments: 0 },
  { month: "Jan", contributions: 67000, loans: 25000, investments: 30000 },
  { month: "Feb", contributions: 72000, loans: 10000, investments: 15000 },
  { month: "Mar", contributions: 78000, loans: 40000, investments: 20000 },
];

export default function Reports() {
  return (
    <AnimatedPage>
      <SEO title="Reports" description="Financial summaries, contribution trends and investment performance analytics for your Chama." path="/dashboard/reports" noindex />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">Financial summaries and analytics</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold mb-4">Fund Allocation</h3>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold mb-4">Monthly Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 89%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(40,15%,89%)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`]}
                  />
                  <Bar dataKey="contributions" fill="hsl(152, 45%, 28%)" radius={[3, 3, 0, 0]} name="Contributions" />
                  <Bar dataKey="loans" fill="hsl(38, 85%, 55%)" radius={[3, 3, 0, 0]} name="Loans" />
                  <Bar dataKey="investments" fill="hsl(205, 78%, 52%)" radius={[3, 3, 0, 0]} name="Investments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Summary Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="rounded-xl border bg-card shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold">Chama Performance Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Chama</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3">Balance</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3">Contributions</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3">Loans Out</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3">Investments</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3">Growth</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Umoja Savings Circle", balance: "234,500", contributions: "480,000", loans: "45,000", investments: "200,000", growth: "+18.2%" },
                  { name: "Maendeleo Investment", balance: "156,800", contributions: "288,000", loans: "25,000", investments: "80,000", growth: "+12.7%" },
                  { name: "Harambee Women's Group", balance: "412,000", contributions: "624,000", loans: "15,000", investments: "50,000", growth: "+22.1%" },
                ].map((c) => (
                  <tr key={c.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-sm font-medium">{c.name}</td>
                    <td className="p-3 text-sm tabular-nums text-right">KES {c.balance}</td>
                    <td className="p-3 text-sm tabular-nums text-right">KES {c.contributions}</td>
                    <td className="p-3 text-sm tabular-nums text-right">KES {c.loans}</td>
                    <td className="p-3 text-sm tabular-nums text-right">KES {c.investments}</td>
                    <td className="p-3 text-sm tabular-nums text-right font-semibold text-success">{c.growth}</td>
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
