import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend,
} from "recharts";

const growthData = [
  { month: "Jul", members: 8, savings: 180000 },
  { month: "Aug", members: 12, savings: 320000 },
  { month: "Sep", members: 15, savings: 480000 },
  { month: "Oct", members: 18, savings: 650000 },
  { month: "Nov", members: 22, savings: 820000 },
  { month: "Dec", members: 25, savings: 980000 },
  { month: "Jan", members: 28, savings: 1100000 },
  { month: "Feb", members: 30, savings: 1250000 },
];

const contributionTrends = [
  { month: "Aug", onTime: 40000, late: 5000, missed: 2000 },
  { month: "Sep", onTime: 48000, late: 4000, missed: 1000 },
  { month: "Oct", onTime: 52000, late: 3000, missed: 2000 },
  { month: "Nov", onTime: 58000, late: 3000, missed: 0 },
  { month: "Dec", onTime: 55000, late: 5000, missed: 1000 },
  { month: "Jan", onTime: 62000, late: 2000, missed: 0 },
  { month: "Feb", onTime: 68000, late: 4000, missed: 0 },
  { month: "Mar", onTime: 72000, late: 3000, missed: 500 },
];

const loanRepayment = [
  { month: "Aug", disbursed: 30000, repaid: 25000, defaulted: 2000 },
  { month: "Sep", disbursed: 15000, repaid: 32000, defaulted: 0 },
  { month: "Oct", disbursed: 45000, repaid: 28000, defaulted: 3000 },
  { month: "Nov", disbursed: 20000, repaid: 40000, defaulted: 1000 },
  { month: "Dec", disbursed: 35000, repaid: 35000, defaulted: 0 },
  { month: "Jan", disbursed: 25000, repaid: 42000, defaulted: 500 },
  { month: "Feb", disbursed: 10000, repaid: 38000, defaulted: 0 },
  { month: "Mar", disbursed: 40000, repaid: 45000, defaulted: 1500 },
];

const tooltipStyle = {
  backgroundColor: "hsl(0, 0%, 100%)",
  border: "1px solid hsl(40, 15%, 89%)",
  borderRadius: "8px",
  fontSize: "12px",
};

const cardClass = "rounded-xl border bg-card p-5 shadow-sm";

export function AdminCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cardClass}
      >
        <h3 className="text-sm font-semibold mb-4">Membership & Savings Growth</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 89%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="members" stroke="hsl(152, 45%, 28%)" strokeWidth={2} name="Members" />
              <Line yAxisId="right" type="monotone" dataKey="savings" stroke="hsl(38, 85%, 55%)" strokeWidth={2} name="Savings (KES)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Contribution Trends */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cardClass}
      >
        <h3 className="text-sm font-semibold mb-4">Contribution Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contributionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 89%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`KES ${value.toLocaleString()}`]} />
              <Legend />
              <Bar dataKey="onTime" fill="hsl(152, 45%, 28%)" radius={[2, 2, 0, 0]} name="On Time" stackId="a" />
              <Bar dataKey="late" fill="hsl(38, 85%, 55%)" radius={[0, 0, 0, 0]} name="Late" stackId="a" />
              <Bar dataKey="missed" fill="hsl(0, 72%, 51%)" radius={[2, 2, 0, 0]} name="Missed" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Loan Repayment Trends */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${cardClass} lg:col-span-2`}
      >
        <h3 className="text-sm font-semibold mb-4">Loan Repayment Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={loanRepayment}>
              <defs>
                <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 85%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38, 85%, 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRepaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 45%, 28%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 45%, 28%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 89%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(150, 10%, 46%)" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`KES ${value.toLocaleString()}`]} />
              <Legend />
              <Area type="monotone" dataKey="disbursed" stroke="hsl(38, 85%, 55%)" strokeWidth={2} fill="url(#colorDisbursed)" name="Disbursed" />
              <Area type="monotone" dataKey="repaid" stroke="hsl(152, 45%, 28%)" strokeWidth={2} fill="url(#colorRepaid)" name="Repaid" />
              <Area type="monotone" dataKey="defaulted" stroke="hsl(0, 72%, 51%)" strokeWidth={2} fill="hsl(0, 72%, 51%, 0.1)" name="Defaulted" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
