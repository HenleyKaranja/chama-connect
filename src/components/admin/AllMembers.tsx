import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  is_approved: boolean;
  created_at: string;
  role?: string;
}

export function AllMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, phone, is_approved, created_at")
        .order("created_at", { ascending: false });

      const { data: roles } = await supabase.from("user_roles").select("user_id, role");

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      setMembers(
        (profiles || []).map((p) => ({
          ...p,
          role: roleMap.get(p.user_id) || "member",
        }))
      );
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-5 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Members ({filtered.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading members...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-4 font-medium">Member</th>
                  <th className="p-4 font-medium">Phone</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {m.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium text-sm">{m.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{m.phone || "—"}</td>
                    <td className="p-4">
                      <Badge variant={m.role === "admin" ? "default" : "secondary"} className="text-xs capitalize">
                        {m.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={m.is_approved ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {m.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
