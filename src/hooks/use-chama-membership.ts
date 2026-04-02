import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useChamaMembership() {
  const { user } = useAuth();

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["chama_members", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("chama_members")
        .select("chama_id, status")
        .eq("user_id", user!.id)
        .eq("status", "active");
      return data ?? [];
    },
    enabled: !!user,
  });

  const hasChama = (memberships?.length ?? 0) > 0;
  const chamaIds = memberships?.map((m) => m.chama_id) ?? [];

  return { hasChama, chamaIds, isLoading };
}
