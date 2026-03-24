import { useEffect, useState } from "react";
import { Users, Wallet, Landmark, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";

export function AdminOverview() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingApprovals: 0,
    totalSavings: 0,
    totalLoans: 0,
    defaultRate: 0,
    activeProjects: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const { count: totalMembers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: pendingApprovals } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);

      const { count: activeProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setStats({
        totalMembers: totalMembers || 0,
        pendingApprovals: pendingApprovals || 0,
        totalSavings: 1250000,
        totalLoans: 480000,
        defaultRate: 3.2,
        activeProjects: activeProjects || 0,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Total Members"
        value={stats.totalMembers.toString()}
        change={`${stats.pendingApprovals} pending approval`}
        changeType={stats.pendingApprovals > 0 ? "negative" : "positive"}
        icon={Users}
        index={0}
      />
      <StatCard
        title="Group Savings"
        value={`KES ${stats.totalSavings.toLocaleString()}`}
        change="+8.4% this month"
        changeType="positive"
        icon={Wallet}
        index={1}
      />
      <StatCard
        title="Total Loans Issued"
        value={`KES ${stats.totalLoans.toLocaleString()}`}
        change="12 active loans"
        changeType="neutral"
        icon={Landmark}
        index={2}
      />
      <StatCard
        title="Default Rate"
        value={`${stats.defaultRate}%`}
        change="Below 5% target"
        changeType="positive"
        icon={AlertTriangle}
        index={3}
      />
      <StatCard
        title="Active Projects"
        value={stats.activeProjects.toString()}
        change="View all projects"
        changeType="neutral"
        icon={TrendingUp}
        index={4}
      />
      <StatCard
        title="Approved Members"
        value={(stats.totalMembers - stats.pendingApprovals).toString()}
        change="All verified"
        changeType="positive"
        icon={CheckCircle}
        index={5}
      />
    </div>
  );
}
