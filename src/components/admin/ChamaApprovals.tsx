import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Users, Clock } from "lucide-react";
import { toast } from "sonner";

interface PendingJoin {
  id: string;
  user_id: string;
  chama_id: string;
  joined_at: string;
  status: string;
  member_name?: string;
  chama_name?: string;
}

export function ChamaApprovals() {
  const [requests, setRequests] = useState<PendingJoin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chama_members")
      .select("*")
      .eq("status", "pending")
      .order("joined_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const chamaIds = [...new Set(data.map(r => r.chama_id))];

      const [{ data: profiles }, { data: chamas }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
        supabase.from("chamas").select("id, name").in("id", chamaIds),
      ]);

      setRequests(data.map(r => ({
        ...r,
        member_name: profiles?.find(p => p.user_id === r.user_id)?.full_name || "Unknown",
        chama_name: chamas?.find(c => c.id === r.chama_id)?.name || "Unknown",
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (req: PendingJoin) => {
    const { error } = await supabase.from("chama_members").update({ status: "active" }).eq("id", req.id);
    if (error) {
      toast.error("Failed to approve");
    } else {
      // Notify the member
      await supabase.from("notifications").insert({
        user_id: req.user_id,
        title: "Chama Membership Approved",
        message: `You have been approved to join ${req.chama_name}.`,
        type: "success",
      });
      // Notify other chama members
      await supabase.rpc("notify_chama_members", {
        _chama_id: req.chama_id,
        _title: "New Member Joined",
        _message: `${req.member_name} has joined ${req.chama_name}.`,
        _type: "info",
        _exclude_user_id: req.user_id,
      });
      toast.success(`${req.member_name} approved for ${req.chama_name}`);
      fetchPending();
    }
  };

  const handleReject = async (req: PendingJoin) => {
    const { error } = await supabase.from("chama_members").update({ status: "rejected" }).eq("id", req.id);
    if (error) {
      toast.error("Failed to reject");
    } else {
      await supabase.from("notifications").insert({
        user_id: req.user_id,
        title: "Chama Request Rejected",
        message: `Your request to join ${req.chama_name} was not approved.`,
        type: "error",
      });
      toast.success(`${req.member_name} rejected`);
      fetchPending();
    }
  };

  if (loading) {
    return <div className="rounded-xl border bg-card p-8 text-center"><p className="text-muted-foreground">Loading pending requests...</p></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-primary mb-3" />
        <h3 className="font-semibold text-lg">No pending requests</h3>
        <p className="text-muted-foreground mt-1">All chama join requests have been processed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-5 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Pending Chama Join Requests ({requests.length})
        </h3>
      </div>
      <div className="divide-y">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {req.member_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{req.member_name}</p>
              <p className="text-xs text-muted-foreground">Wants to join {req.chama_name}</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {new Date(req.joined_at).toLocaleDateString()}
            </Badge>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleApprove(req)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleReject(req)}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
