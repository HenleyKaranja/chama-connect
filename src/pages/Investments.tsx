import { useState } from "react";
import { AnimatedPage, StaggerContainer, staggerItem } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { TrendingUp, Building2, Plus, HandCoins } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useChamaMembership } from "@/hooks/use-chama-membership";
import { toast } from "sonner";

export default function Investments() {
  const { user, role } = useAuth();
  const { chamaIds } = useChamaMembership();
  const queryClient = useQueryClient();

  const [investOpen, setInvestOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", chamaIds, role],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, chamas(name)")
        .order("created_at", { ascending: false });

      if (role !== "admin" && chamaIds.length > 0) {
        query = query.in("chama_id", chamaIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myInvestments } = useQuery({
    queryKey: ["my_investments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_contributions" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const totalInvested = projects?.reduce((s, p) => s + Number(p.current_amount), 0) ?? 0;
  const totalTarget = projects?.reduce((s, p) => s + Number(p.target_amount), 0) ?? 0;
  const activeCount = projects?.filter(p => p.status === "active").length ?? 0;
  const overallProgress = totalTarget > 0 ? Math.round((totalInvested / totalTarget) * 100) : 0;
  const myTotal = myInvestments?.reduce((s: number, i: any) => s + Number(i.amount), 0) ?? 0;

  const openInvestDialog = (proj: any) => {
    setSelectedProject(proj);
    setAmount("");
    setPaymentMethod("mpesa");
    setNotes("");
    setInvestOpen(true);
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("investment_contributions" as any).insert({
        project_id: selectedProject.id,
        user_id: user!.id,
        chama_id: selectedProject.chama_id,
        amount: Number(amount),
        payment_method: paymentMethod,
        notes: notes || null,
      } as any);
      if (error) throw error;
      toast.success("Investment recorded successfully!");
      setInvestOpen(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["my_investments"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to record investment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground mt-1">Track and contribute to group investment projects</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Raised" value={`KES ${totalInvested.toLocaleString()}`} icon={TrendingUp} index={0} />
          <StatCard title="Target" value={`KES ${totalTarget.toLocaleString()}`} change={`${overallProgress}% funded`} changeType={overallProgress >= 50 ? "positive" : "neutral"} icon={TrendingUp} index={1} />
          <StatCard title="Active Projects" value={String(activeCount)} change={`${projects?.length ?? 0} total`} icon={Building2} index={2} />
          <StatCard title="My Contributions" value={`KES ${myTotal.toLocaleString()}`} change={`${myInvestments?.length ?? 0} payments`} changeType="positive" icon={HandCoins} index={3} />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No investment projects yet.</div>
        ) : (
          <StaggerContainer className="space-y-4">
            {projects.map((proj) => {
              const progress = Number(proj.target_amount) > 0 ? Math.round((Number(proj.current_amount) / Number(proj.target_amount)) * 100) : 0;
              const remaining = Math.max(0, Number(proj.target_amount) - Number(proj.current_amount));
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
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${proj.status === "active" ? "bg-success/10 text-success" : proj.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {proj.status}
                          </span>
                          {proj.status === "active" && (
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openInvestDialog(proj)}>
                              <Plus className="h-3.5 w-3.5" /> Invest
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Raised</p>
                          <p className="text-sm font-semibold tabular-nums">KES {Number(proj.current_amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="text-sm font-semibold tabular-nums">KES {Number(proj.target_amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className="text-sm font-semibold tabular-nums">KES {remaining.toLocaleString()}</p>
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

      {/* Investment Payment Dialog */}
      <Dialog open={investOpen} onOpenChange={setInvestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest in {selectedProject?.name}</DialogTitle>
            <DialogDescription>
              {(selectedProject as any)?.chamas?.name && (
                <span className="text-primary font-medium">{(selectedProject as any).chamas.name} · </span>
              )}
              Target: KES {Number(selectedProject?.target_amount ?? 0).toLocaleString()} · 
              Remaining: KES {Math.max(0, Number(selectedProject?.target_amount ?? 0) - Number(selectedProject?.current_amount ?? 0)).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Amount (KES)</Label>
              <Input
                id="inv-amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="inv-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notes (optional)</Label>
              <Textarea
                id="inv-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? "Processing..." : (
                <>
                  <HandCoins className="h-4 w-4" /> Confirm Investment
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
