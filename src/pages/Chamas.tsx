import { useState } from "react";
import { AnimatedPage, StaggerContainer, staggerItem } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Users, Plus, Copy, MoreVertical, Crown, LogOut, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";

const colors = [
  "from-primary/20 to-primary/5",
  "from-accent/20 to-accent/5",
  "from-info/20 to-info/5",
  "from-warning/20 to-warning/5",
];

export default function Chamas() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");

  const { data: chamas, isLoading } = useQuery({
    queryKey: ["chamas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chamas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: memberships } = useQuery({
    queryKey: ["chama_members", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("chama_members").select("chama_id").eq("user_id", user!.id);
      if (error) throw error;
      return data?.map(m => m.chama_id) ?? [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("chamas").insert({
        name,
        description,
        contribution_amount: parseFloat(contributionAmount) || 0,
        created_by: user!.id,
      }).select().single();
      if (error) throw error;
      // Auto-join as member
      await supabase.from("chama_members").insert({ chama_id: data.id, user_id: user!.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamas"] });
      queryClient.invalidateQueries({ queryKey: ["chama_members"] });
      toast.success("Chama created successfully");
      setOpen(false);
      setName("");
      setDescription("");
      setContributionAmount("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const joinMutation = useMutation({
    mutationFn: async (chamaId: string) => {
      const { error } = await supabase.from("chama_members").insert({ chama_id: chamaId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chama_members"] });
      toast.success("Joined chama!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const leaveMutation = useMutation({
    mutationFn: async (chamaId: string) => {
      // Cycle gate
      const { data: canLeave } = await supabase.rpc("can_leave_chama", { _user_id: user!.id, _chama_id: chamaId });
      if (canLeave === false) {
        throw new Error("You cannot leave during an active merry-go-round cycle. Wait until all recipients have been paid out, or ask an admin to remove you.");
      }
      const { error } = await supabase
        .from("chama_members")
        .delete()
        .eq("chama_id", chamaId)
        .eq("user_id", user!.id);
      if (error) throw error;
      await logAuditEvent("chama_left", "chama", chamaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chama_members"] });
      toast.success("You have left the chama");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Chamas</h1>
            <p className="text-muted-foreground mt-1">Manage your savings groups</p>
          </div>
          <div className="flex gap-2">
            {role === "admin" && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" />Create Chama</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create a New Chama</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Chama Name</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Umoja Savings" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Monthly savings group" />
                    </div>
                    <div>
                      <Label>Contribution Amount (KES)</Label>
                      <Input type="number" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="5000" />
                    </div>
                    <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="w-full">
                      {createMutation.isPending ? "Creating..." : "Create Chama"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : chamas?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No chamas yet.</div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {chamas?.map((chama, i) => {
              const isMember = memberships?.includes(chama.id);
              return (
                <motion.div
                  key={chama.id}
                  variants={staggerItem}
                  className="group rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className={`h-24 bg-gradient-to-br ${colors[i % colors.length]} p-5 flex items-start justify-between`}>
                    <div>
                      {chama.created_by === user?.id && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm">
                          <Crown className="h-3 w-3" /> Creator
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-semibold">{chama.name}</h3>
                      {chama.description && <p className="text-xs text-muted-foreground mt-1">{chama.description}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Savings</p>
                        <p className="text-sm font-semibold tabular-nums">KES {Number(chama.total_savings).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contribution</p>
                        <p className="text-sm font-semibold tabular-nums">KES {Number(chama.contribution_amount).toLocaleString()}/{chama.contribution_frequency}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      {isMember ? (
                        <>
                          <span className="text-xs text-success font-medium">✓ Member</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Leave ${chama.name}? You can't leave during an active cycle.`)) {
                                leaveMutation.mutate(chama.id);
                              }
                            }}
                          >
                            <LogOut className="h-3 w-3 mr-1" /> Leave
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => joinMutation.mutate(chama.id)}>
                          Join
                        </Button>
                      )}
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
