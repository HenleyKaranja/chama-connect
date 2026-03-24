import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowRight } from "lucide-react";

const cycles = [
  { cycle: 1, recipient: "Grace Muthoni", amount: "KES 50,000", date: "Jan 28, 2026", status: "completed" },
  { cycle: 2, recipient: "Peter Ochieng", amount: "KES 50,000", date: "Feb 28, 2026", status: "completed" },
  { cycle: 3, recipient: "Faith Akinyi", amount: "KES 50,000", date: "Mar 28, 2026", status: "current" },
  { cycle: 4, recipient: "James Kamau", amount: "KES 50,000", date: "Apr 28, 2026", status: "upcoming" },
  { cycle: 5, recipient: "Mary Njeri", amount: "KES 50,000", date: "May 28, 2026", status: "upcoming" },
  { cycle: 6, recipient: "David Wanjiku", amount: "KES 50,000", date: "Jun 28, 2026", status: "upcoming" },
];

export function MerryGoRound() {
  const currentCycle = cycles.find((c) => c.status === "current");

  return (
    <div className="space-y-6">
      {/* Current Cycle Highlight */}
      {currentCycle && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Current Cycle #{currentCycle.cycle}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Recipient</p>
              <p className="font-semibold">{currentCycle.recipient}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold">{currentCycle.amount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payout Date</p>
              <p className="font-semibold">{currentCycle.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* All Cycles */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-5 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> All Cycles
          </h3>
        </div>
        <div className="divide-y">
          {cycles.map((cycle, i) => (
            <div
              key={cycle.cycle}
              className={`flex items-center gap-4 p-4 transition-colors ${
                cycle.status === "current" ? "bg-primary/5" : "hover:bg-muted/30"
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                cycle.status === "completed"
                  ? "bg-primary/10 text-primary"
                  : cycle.status === "current"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {cycle.cycle}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cycle.recipient}</p>
                <p className="text-xs text-muted-foreground">{cycle.date}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{cycle.amount}</p>
              <Badge
                variant={
                  cycle.status === "completed" ? "default" :
                  cycle.status === "current" ? "secondary" : "outline"
                }
                className="text-xs capitalize"
              >
                {cycle.status}
              </Badge>
              {i < cycles.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
