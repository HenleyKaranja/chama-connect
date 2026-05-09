import { useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { hashPin, isValidPin } from "@/lib/pin";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onVerified: () => void | Promise<void>;
  title?: string;
  description?: string;
}

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export function TransactionPinGate({ open, onOpenChange, onVerified, title = "Confirm with Transaction PIN", description = "Enter your 4-6 digit PIN to authorise this action." }: Props) {
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  const check = async () => {
    if (!user) return;
    if (!isValidPin(pin)) { toast.error("PIN must be 4-6 digits"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("transaction_pin_hash, pin_attempts, pin_locked_until")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      if (!data?.transaction_pin_hash) {
        setHasPin(false);
        return;
      }
      if (data.pin_locked_until && new Date(data.pin_locked_until) > new Date()) {
        toast.error("PIN locked. Try again later.");
        return;
      }
      const hash = await hashPin(user.id, pin);
      if (hash !== data.transaction_pin_hash) {
        const attempts = (data.pin_attempts ?? 0) + 1;
        const locked = attempts >= MAX_ATTEMPTS;
        await supabase.from("profiles").update({
          pin_attempts: locked ? 0 : attempts,
          pin_locked_until: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
        }).eq("user_id", user.id);
        toast.error(locked ? `Too many attempts. PIN locked for ${LOCK_MINUTES} minutes.` : `Wrong PIN (${MAX_ATTEMPTS - attempts} left)`);
        setPin("");
        return;
      }
      // success
      await supabase.from("profiles").update({ pin_attempts: 0, pin_locked_until: null }).eq("user_id", user.id);
      setPin("");
      onOpenChange(false);
      await onVerified();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setPin(""); setHasPin(null); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {hasPin === false ? (
          <div className="space-y-3 py-2 text-sm">
            <div className="flex gap-2 rounded-md bg-warning/10 p-3 text-warning border border-warning/30">
              <ShieldAlert className="h-4 w-4 mt-0.5" />
              <p>You haven't set a Transaction PIN yet. Set one in Settings to authorise money actions.</p>
            </div>
            <Button asChild className="w-full"><Link to="/dashboard/settings">Go to Settings</Link></Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label>PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-xl tracking-widest"
                autoFocus
              />
            </div>
            <Button onClick={check} disabled={busy || pin.length < 4} className="w-full">
              {busy ? "Verifying..." : "Confirm"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
