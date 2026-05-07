import { supabase } from "@/integrations/supabase/client";

export async function logAuditEvent(
  action: string,
  entityType?: string | null,
  entityId?: string | null,
  details?: Record<string, string | number | boolean | null>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_logs").insert([{
    user_id: user.id,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    details: details ?? {},
  }]);
}
