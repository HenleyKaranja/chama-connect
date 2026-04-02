import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CycleRow {
  id: string;
  cycle_number: number;
  amount: number;
  payout_date: string;
  status: string;
  recipient_user_id: string;
  chama_id: string;
  recipient_name?: string;
}

export function MerryGoRound() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedChama, setSelectedChama] = useState("");
  const [filterChama, setFilterChama] = useState<string>("all");

  const [form, setForm] = useState({
    chama_id: "",
    recipient_user_id: "",
    amount: "",
    payout_date: "",
  });

  // Fetch all chamas
  const { data: chamas = [] } = useQuery({
    queryKey: ["chamas"],
    queryFn: async () => {
      const { data } = await supabase.from("chamas").select("id, name").order("name");
      return data ?? [];
    },
  });

  // Fetch members of selected chama (for recipient picker)
  const { data: chamaMembers = [] } = useQuery({
    queryKey: ["chama-members-for-cycle", form.chama_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("chama_members")
        .select("user_id")
        .eq("chama_id", form.chama_id)
        .eq("status", "active");
      if (!data?.length) return [];
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      return profiles ?? [];
    },
    enabled: !!form.chama_id,
  });

  // Fetch all cycles
  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["merry-go-round-cycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merry_go_round_cycles")
        .select("*")
        .order("cycle_number", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((c: any) => c.recipient_user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
        : { data: [] };
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      return (data || []).map((c: any) => ({
        ...c,
        recipient_name: profileMap.get(c.recipient_user_id) || "Unknown Member",
      }));
    },
  });

  // Get next cycle number for a chama
  const getNextCycleNumber = (chamaId: string) => {
    const chamaCycles = cycles.filter((c) => c.chama_id === chamaId);
    return chamaCycles.length > 0 ? Math.max(...chamaCycles.map((c) => c.cycle_number)) + 1 : 1;
  };

  // Create cycle
  const createMutation = useMutation({
    mutationFn: async () => {
      const cycleNumber = getNextCycleNumber(form.chama_id);
      const { error } = await supabase.from("merry_go_round_cycles").insert({
        chama_id: form.chama_id,
        cycle_number: cycleNumber,
        recipient_user_id: form.recipient_user_id,
        amount: parseFloat(form.amount),
        payout_date: form.payout_date,
        status: cycleNumber === 1 ? "current" : "upcoming",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merry-go-round-cycles"] });
      toast.success("Cycle created successfully");
      setForm({ chama_id: form.chama_id, recipient_user_id: "", amount: "", payout_date: "" });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update cycle status
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("merry_go_round_cycles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merry-go-round-cycles"] });
      toast.success("Cycle status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete cycle
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("merry_go_round_cycles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merry-go-round-cycles"] });
      toast.success("Cycle deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredCycles = filterChama === "all" ? cycles : cycles.filter((c) => c.chama_id === filterChama);
  const currentCycle = filteredCycles.find((c: any) => c.status === "current");

  const getChamaName = (chamaId: string) => chamas.find((c) => c.id === chamaId)?.name || "Unknown";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filter and create button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Merry-Go-Round Cycles
          </h3>
          <Select value={filterChama} onValueChange={setFilterChama}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Filter by chama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chamas</SelectItem>
              {chamas.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Add Cycle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Merry-Go-Round Cycle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Chama</Label>
                <Select value={form.chama_id} onValueChange={(v) => setForm({ ...form, chama_id: v, recipient_user_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select chama" /></SelectTrigger>
                  <SelectContent>
                    {chamas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recipient</Label>
                <Select
                  value={form.recipient_user_id}
                  onValueChange={(v) => setForm({ ...form, recipient_user_id: v })}
                  disabled={!form.chama_id}
                >
                  <SelectTrigger><SelectValue placeholder={form.chama_id ? "Select member" : "Select chama first"} /></SelectTrigger>
                  <SelectContent>
                    {chamaMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (KES)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 50000"
                />
              </div>
              <div>
                <Label>Payout Date</Label>
                <Input
                  type="date"
                  value={form.payout_date}
                  onChange={(e) => setForm({ ...form, payout_date: e.target.value })}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.chama_id || !form.recipient_user_id || !form.amount || !form.payout_date || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Creating..." : `Create Cycle #${getNextCycleNumber(form.chama_id)}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current cycle highlight */}
      {currentCycle && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Current Cycle #{currentCycle.cycle_number}</h3>
            <Badge variant="outline" className="text-xs">{getChamaName(currentCycle.chama_id)}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Recipient</p>
              <p className="font-semibold">{currentCycle.recipient_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold">KES {Number(currentCycle.amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payout Date</p>
              <p className="font-semibold">{new Date(currentCycle.payout_date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cycles list */}
      {filteredCycles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>No merry-go-round cycles configured yet.</p>
          <p className="text-xs mt-1">Use the "Add Cycle" button to set up rotation cycles.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-5 border-b">
            <h3 className="font-semibold">All Cycles ({filteredCycles.length})</h3>
          </div>
          <div className="divide-y">
            {filteredCycles.map((cycle: any, i: number) => (
              <div
                key={cycle.id}
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
                  {cycle.cycle_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{cycle.recipient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getChamaName(cycle.chama_id)} · {new Date(cycle.payout_date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums hidden sm:block">KES {Number(cycle.amount).toLocaleString()}</p>

                {/* Status selector */}
                <Select
                  value={cycle.status}
                  onValueChange={(v) => statusMutation.mutate({ id: cycle.id, status: v })}
                >
                  <SelectTrigger className="w-[110px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(cycle.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
