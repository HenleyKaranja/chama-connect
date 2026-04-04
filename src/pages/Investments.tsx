import { AnimatedPage, StaggerContainer, staggerItem } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { TrendingUp, Building2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useChamaMembership } from "@/hooks/use-chama-membership";

export default function Investments() {
  const { user, role } = useAuth();
  const { chamaIds } = useChamaMembership();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", chamaIds, role],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, chamas(name)")
        .order("created_at", { ascending: false });

      // Non-admin members only see their chama's projects
      if (role !== "admin" && chamaIds.length > 0) {
        query = query.in("chama_id", chamaIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalInvested = projects?.reduce((s, p) => s + Number(p.current_amount), 0) ?? 0;
  const totalTarget = projects?.reduce((s, p) => s + Number(p.target_amount), 0) ?? 0;
  const activeCount = projects?.filter(p => p.status === "active").length ?? 0;
  const overallProgress = totalTarget > 0 ? Math.round((totalInvested / totalTarget) * 100) : 0;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground mt-1">Track group investment projects</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Invested" value={`KES ${totalInvested.toLocaleString()}`} icon={TrendingUp} index={0} />
          <StatCard title="Target" value={`KES ${totalTarget.toLocaleString()}`} change={`${overallProgress}% funded`} changeType={overallProgress >= 50 ? "positive" : "neutral"} icon={TrendingUp} index={1} />
          <StatCard title="Active Projects" value={String(activeCount)} change={`${projects?.length ?? 0} total`} icon={Building2} index={2} />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No investment projects yet.</div>
        ) : (
          <StaggerContainer className="space-y-4">
            {projects.map((proj) => {
              const progress = Number(proj.target_amount) > 0 ? Math.round((Number(proj.current_amount) / Number(proj.target_amount)) * 100) : 0;
              return (
                <motion.div key={proj.id} variants={staggerItem} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{proj.name}</p>
                          {(proj as any).chamas?.name && <p className="text-xs text-primary font-medium">{(proj as any).chamas.name}</p>}
                          {proj.description && <p className="text-xs text-muted-foreground">{proj.description}</p>}
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${proj.status === "active" ? "bg-success/10 text-success" : proj.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {proj.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Raised</p>
                          <p className="text-sm font-semibold tabular-nums">KES {Number(proj.current_amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="text-sm font-semibold tabular-nums">KES {Number(proj.target_amount).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </AnimatedPage>
  );
}
