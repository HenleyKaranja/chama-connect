import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Settings, CheckCircle2, Ban } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";
import { useAuth } from "@/contexts/AuthContext";

export function PenaltiesManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [billOpen, setBillOpen] = useState(false);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const [bill, setBill] = useState({ chama_id: "", user_id: "", amount: "", reason: "" });
  const [cfg, setCfg] = useState({ chama_id: "", penalty_type: "flat", penalty_amount: "", penalty_grace_days: "3" });

  const { data: chamas = [] } = useQuery({
    queryKey: ["chamas-penalty"],
    queryFn: async () => (await supabase.from("chamas").select("id, name, penalty_type, penalty_amount, penalty_grace_days").order("name")).data ?? [],
  });

  const { data: chamaMembers = [] } = useQuery({
    queryKey: ["chama-members-pen", bill.chama_id],
    queryFn: async () => {
      const { data: cm } = await supabase.from("chama_members").select("user_id").eq("chama_id", bill.chama_id).eq("status", "active");
      const ids = (cm ?? []).map((m) => m.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      return profs ?? [];
    },
    enabled: !!bill.chama_id,
  });

  const { data: penalties = [], isLoading } = useQuery({
    queryKey: ["penalties-admin", filter],
    queryFn: async () => {
      let q = supabase.from("penalties").select("*").order("created_at", { ascending: false });
      if (filter === "pending") q = q.eq("status", "pending");
      const { data } = await q;
      const userIds = [...new Set((data ?? []).map((p: any) => p.user_id))];
      const chamaIds = [...new Set((data ?? []).map((p: any) => p.chama_id))];
      const [{ data: profs }, { data: chs }] = await Promise.all([
        userIds.length ? supabase.from("profiles").select("user_id, full_name").in("user_id", userIds) : Promise.resolve({ data: [] as any[] }),
        chamaIds.length ? supabase.from("chamas").select("id, name").in("id", chamaIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const pm = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
      const cm = new Map((chs || []).map((c: any) => [c.id, c.name]));
      return (data || []).map((p: any) => ({ ...p, member_name: pm.get(p.user_id) || "Unknown", chama_name: cm.get(p.chama_id) || "—" }));
    },
  });

  const billMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("penalties").insert({
        user_id: bill.user_id,
        chama_id: bill.chama_id,
        amount: parseFloat(bill.amount),
        reason: bill.reason || "Missed contribution",
      });
      if (error) throw error;
      await logAuditEvent("penalty_billed", "penalty", null, { user_id: bill.user_id, amount: parseFloat(bill.amount) });
      await supabase.from("notifications").insert({
        user_id: bill.user_id,
        title: "Penalty Billed",
        message: `A penalty of KES ${bill.amount} has been billed to your account: ${bill.reason || "Missed contribution"}`,
        type: "warning",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penalties-admin"] });
      toast.success("Penalty billed");
      setBillOpen(false);
      setBill({ chama_id: "", user_id: "", amount: "", reason: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resolve = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "paid" | "waived" }) => {
      const { error } = await supabase.from("penalties").update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: user!.id,
      }).eq("id", id);
      if (error) throw error;
      await logAuditEvent(`penalty_${status}`, "penalty", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penalties-admin"] });
      toast.success("Penalty updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveCfg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chamas").update({
        penalty_type: cfg.penalty_type,
        penalty_amount: parseFloat(cfg.penalty_amount) || 0,
        penalty_grace_days: parseInt(cfg.penalty_grace_days) || 0,
      }).eq("id", cfg.chama_id);
      if (error) throw error;
      await logAuditEvent("penalty_config_updated", "chama", cfg.chama_id, { ...cfg });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chamas-penalty"] });
      toast.success("Penalty rules updated");
      setCfgOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Penalties
        </h3>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending only</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={cfgOpen} onOpenChange={setCfgOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Settings className="h-3.5 w-3.5 mr-1" /> Configure Rules</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Configure Chama Penalty Rules</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Chama</Label>
                  <Select value={cfg.chama_id} onValueChange={(v) => {
                    const c: any = chamas.find((x: any) => x.id === v);
                    setCfg({
                      chama_id: v,
                      penalty_type: c?.penalty_type || "flat",
                      penalty_amount: String(c?.penalty_amount ?? ""),
                      penalty_grace_days: String(c?.penalty_grace_days ?? 3),
                    });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select chama" /></SelectTrigger>
                    <SelectContent>
                      {chamas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Penalty Type</Label>
                  <Select value={cfg.penalty_type} onValueChange={(v) => setCfg({ ...cfg, penalty_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat fee per missed payment</SelectItem>
                      <SelectItem value="percentage">% of contribution amount</SelectItem>
                      <SelectItem value="daily">Daily late fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount {cfg.penalty_type === "percentage" ? "(%)" : "(KES)"}</Label>
                  <Input type="number" value={cfg.penalty_amount} onChange={(e) => setCfg({ ...cfg, penalty_amount: e.target.value })} />
                </div>
                <div>
                  <Label>Grace Period (days)</Label>
                  <Input type="number" value={cfg.penalty_grace_days} onChange={(e) => setCfg({ ...cfg, penalty_grace_days: e.target.value })} />
                </div>
                <Button onClick={() => saveCfg.mutate()} disabled={!cfg.chama_id || saveCfg.isPending} className="w-full">
                  {saveCfg.isPending ? "Saving..." : "Save Rules"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={billOpen} onOpenChange={setBillOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Bill Penalty</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bill a Penalty</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Chama</Label>
                  <Select value={bill.chama_id} onValueChange={(v) => setBill({ ...bill, chama_id: v, user_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select chama" /></SelectTrigger>
                    <SelectContent>{chamas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Member</Label>
                  <Select value={bill.user_id} onValueChange={(v) => setBill({ ...bill, user_id: v })} disabled={!bill.chama_id}>
                    <SelectTrigger><SelectValue placeholder={bill.chama_id ? "Select member" : "Select chama first"} /></SelectTrigger>
                    <SelectContent>{chamaMembers.map((m: any) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (KES)</Label>
                  <Input type="number" value={bill.amount} onChange={(e) => setBill({ ...bill, amount: e.target.value })} placeholder="200" />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Input value={bill.reason} onChange={(e) => setBill({ ...bill, reason: e.target.value })} placeholder="Missed monthly contribution" />
                </div>
                <Button onClick={() => billMutation.mutate()} disabled={!bill.user_id || !bill.amount || billMutation.isPending} className="w-full">
                  {billMutation.isPending ? "Billing..." : "Bill Penalty"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Member</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Chama</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Reason</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : penalties.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No penalties.</td></tr>
            ) : penalties.map((p: any) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 text-sm font-medium">{p.member_name}</td>
                <td className="p-3 text-sm text-muted-foreground">{p.chama_name}</td>
                <td className="p-3 text-sm tabular-nums font-semibold">KES {Number(p.amount).toLocaleString()}</td>
                <td className="p-3 text-sm text-muted-foreground">{p.reason}</td>
                <td className="p-3">
                  <Badge variant={p.status === "paid" ? "default" : p.status === "waived" ? "secondary" : "destructive"}>
                    {p.status}
                  </Badge>
                </td>
                <td className="p-3">
                  {p.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => resolve.mutate({ id: p.id, status: "paid" })}>
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => resolve.mutate({ id: p.id, status: "waived" })}>
                        <Ban className="h-3 w-3" /> Waive
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
