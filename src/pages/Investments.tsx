import { AnimatedPage, StaggerContainer, staggerItem } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { TrendingUp, Plus, Building2, Leaf, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { Progress } from "@/components/ui/progress";

const investments = [
  {
    id: 1,
    name: "Kilifi Beach Apartments",
    type: "Real Estate",
    icon: Building2,
    invested: "KES 200,000",
    currentValue: "KES 248,000",
    roi: "+24%",
    roiPositive: true,
    progress: 65,
    maturity: "Dec 2026",
    chama: "Umoja Savings Circle",
  },
  {
    id: 2,
    name: "Organic Tea Farm - Kericho",
    type: "Agriculture",
    icon: Leaf,
    invested: "KES 80,000",
    currentValue: "KES 92,400",
    roi: "+15.5%",
    roiPositive: true,
    progress: 40,
    maturity: "Sep 2027",
    chama: "Maendeleo Investment",
  },
  {
    id: 3,
    name: "Mama Mboga Supply Chain",
    type: "Retail",
    icon: ShoppingBag,
    invested: "KES 50,000",
    currentValue: "KES 46,800",
    roi: "-6.4%",
    roiPositive: false,
    progress: 80,
    maturity: "Jun 2026",
    chama: "Harambee Women's Group",
  },
];

export default function Investments() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
            <p className="text-muted-foreground mt-1">Track your group investments and returns</p>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Investment
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Invested" value="KES 330,000" icon={TrendingUp} index={0} />
          <StatCard title="Current Value" value="KES 387,200" change="+17.3% overall ROI" changeType="positive" icon={TrendingUp} index={1} />
          <StatCard title="Active Projects" value="3" change="Across 3 chamas" icon={Building2} index={2} />
        </div>

        <StaggerContainer className="space-y-4">
          {investments.map((inv) => (
            <motion.div
              key={inv.id}
              variants={staggerItem}
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <inv.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.type} · {inv.chama}</p>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${inv.roiPositive ? "text-success" : "text-destructive"}`}>
                      {inv.roi}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Invested</p>
                      <p className="text-sm font-semibold tabular-nums">{inv.invested}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Value</p>
                      <p className="text-sm font-semibold tabular-nums">{inv.currentValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Maturity</p>
                      <p className="text-sm font-semibold">{inv.maturity}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{inv.progress}%</span>
                    </div>
                    <Progress value={inv.progress} className="h-1.5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </AnimatedPage>
  );
}
