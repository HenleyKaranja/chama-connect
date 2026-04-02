import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface Project {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  status: string;
  created_at: string;
  chama_id: string | null;
}

export function ProjectsManager() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", target_amount: "", chama_id: "" });

  const { data: chamas } = useQuery({
    queryKey: ["chamas"],
    queryFn: async () => {
      const { data } = await supabase.from("chamas").select("id, name").order("name");
      return data ?? [];
    },
  });

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProjects(data);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.target_amount || !form.chama_id) {
      toast.error("Name, chama, and target amount are required");
      return;
    }

    const { error } = await supabase.from("projects").insert({
      name: form.name,
      description: form.description || null,
      target_amount: parseFloat(form.target_amount),
      created_by: user?.id,
      chama_id: form.chama_id,
    });

    if (error) {
      toast.error("Failed to create project");
    } else {
      toast.success("Project created successfully");
      setForm({ name: "", description: "", target_amount: "" });
      setOpen(false);
      fetchProjects();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FolderOpen className="h-4 w-4" /> Projects ({projects.length})
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Add Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Project Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Land Purchase"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the project..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Target Amount (KES)</Label>
                <Input
                  type="number"
                  value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                  placeholder="e.g. 500000"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Create Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No projects yet. Create your first project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const progress = p.target_amount > 0 ? (p.current_amount / p.target_amount) * 100 : 0;
            return (
              <div key={p.id} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{p.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description || "No description"}</p>
                  </div>
                  <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
                    {p.status}
                  </Badge>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>KES {p.current_amount.toLocaleString()}</span>
                    <span>KES {p.target_amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% funded</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
