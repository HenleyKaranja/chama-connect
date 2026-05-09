import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { hashPin, isValidPin } from "@/lib/pin";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";

export function PinSetupCard() {
  const { user } = useAuth();
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("transaction_pin_hash").eq("user_id", user.id).single()
      .then(({ data }) => setHasPin(!!data?.transaction_pin_hash));
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!isValidPin(pin)) return toast.error("PIN must be 4-6 digits");
    if (pin !== confirmPin) return toast.error("PINs do not match");
    setSaving(true);
    try {
      const hash = await hashPin(user.id, pin);
      const { error } = await supabase.from("profiles").update({
        transaction_pin_hash: hash,
        pin_set_at: new Date().toISOString(),
        pin_attempts: 0,
        pin_locked_until: null,
      }).eq("user_id", user.id);
      if (error) throw error;
      await logAuditEvent(hasPin ? "pin_changed" : "pin_set", "security", user.id);
      toast.success(hasPin ? "Transaction PIN updated" : "Transaction PIN set");
      setHasPin(true);
      setPin(""); setConfirmPin("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="h-4 w-4" /> Transaction PIN
        {hasPin && <span className="ml-auto inline-flex items-center gap-1 text-xs text-success font-medium"><ShieldCheck className="h-3 w-3" /> Active</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        A 4-6 digit code required to confirm contributions, withdrawals and loan actions.
        After 5 wrong tries the PIN locks for 15 minutes.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{hasPin ? "New PIN" : "PIN"}</Label>
          <Input type="password" inputMode="numeric" maxLength={6} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="text-center tracking-widest" />
        </div>
        <div>
          <Label className="text-xs">Confirm PIN</Label>
          <Input type="password" inputMode="numeric" maxLength={6} value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="text-center tracking-widest" />
        </div>
      </div>
      <Button size="sm" onClick={save} disabled={saving || !pin}>
        {saving ? "Saving..." : hasPin ? "Update PIN" : "Set PIN"}
      </Button>
    </div>
  );
}
