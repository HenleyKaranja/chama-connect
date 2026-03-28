import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PendingMember {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  is_approved: boolean;
}

export function MemberApprovals() {
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PendingMember | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone, created_at, is_approved")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });
    if (!error && data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (userId: string, name: string) => {
    const { error } = await supabase.from("profiles").update({ is_approved: true, rejection_reason: null }).eq("user_id", userId);
    if (error) {
      toast.error("Failed to approve member");
    } else {
      await supabase.from("notifications").insert({ user_id: userId, title: "Account Approved", message: "Your account has been approved. Welcome to the chama!", type: "success" });
      await supabase.rpc("notify_all_members", { _title: "New Member Joined", _message: `${name} has been approved and joined the platform.`, _type: "info" });
      toast.success(`${name} has been approved`);
      fetchPending();
    }
  };

  const openReject = (member: PendingMember) => {
    setRejectTarget(member);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const { error } = await supabase.from("profiles").update({ rejection_reason: rejectReason || "Application rejected" }).eq("user_id", rejectTarget.user_id);
    if (error) {
      toast.error("Failed to reject member");
    } else {
      await supabase.from("notifications").insert({ user_id: rejectTarget.user_id, title: "Application Rejected", message: rejectReason || "Your application has been rejected.", type: "error" });
      toast.success(`${rejectTarget.full_name} has been rejected`);
      setRejectOpen(false);
      fetchPending();
    }
  };

  if (loading) return <div className="rounded-xl border bg-card p-8 text-center"><p className="text-muted-foreground">Loading pending approvals...</p></div>;

  if (members.length === 0) return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
      <h3 className="font-semibold text-lg">All caught up!</h3>
      <p className="text-muted-foreground mt-1">No pending member approvals.</p>
    </div>
  );

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-5 border-b">
          <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-warning" />Pending Approvals ({members.length})</h3>
        </div>
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {member.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{member.full_name}</p>
                <p className="text-xs text-muted-foreground">{member.phone || "No phone"}</p>
              </div>
              <Badge variant="secondary" className="text-xs">{new Date(member.created_at).toLocaleDateString()}</Badge>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(member.user_id, member.full_name)}><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => openReject(member)}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {rejectTarget?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Reason for Rejection</Label>
              <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Incomplete documents, not verified..." />
            </div>
            <Button variant="destructive" onClick={handleReject} className="w-full">Confirm Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
