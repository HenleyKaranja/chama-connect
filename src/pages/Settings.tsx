import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { User, Shield, Bell as BellIcon, LogOut, KeyRound, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PinSetupCard } from "@/components/security/PinSetupCard";
import { ActiveSessions } from "@/components/security/ActiveSessions";
import { SEO } from "@/components/SEO";

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const authProvider = user?.app_metadata?.provider || "email";
  const hasPassword = authProvider === "email";

  const [passOpen, setPassOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("user_id", user.id);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
      setEditOpen(false);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPass || newPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password changed successfully");
      setPassOpen(false);
      setCurrentPass("");
      setNewPass("");
    }
    setChangingPass(false);
  };

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <AnimatedPage>
      <SEO title="Settings" description="Manage your M-Chama profile, transaction PIN, active sessions and notification preferences." path="/dashboard/settings" noindex />
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences</p>
        </div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4" /> Profile
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{initials}</div>
            <div>
              <p className="font-semibold">{profile?.full_name || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.phone && <p className="text-xs text-muted-foreground mt-0.5">{profile.phone}</p>}
            </div>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => { setFullName(profile?.full_name ?? ""); setPhone(profile?.phone ?? ""); }}>Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4" /> Security
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasPassword ? <KeyRound className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">Sign-in method</p>
                  <p className="text-xs text-muted-foreground">{hasPassword ? `Email: ${user?.email}` : `Phone OTP: ${profile?.phone || user?.phone}`}</p>
                </div>
              </div>
            </div>

            <Dialog open={passOpen} onOpenChange={setPassOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <KeyRound className="h-3.5 w-3.5" />
                  {hasPassword ? "Change Password" : "Set Password"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{hasPassword ? "Change Password" : "Set a Password"}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {hasPassword
                      ? "Enter a new password for your account."
                      : "Add a password to sign in with email as an alternative to phone OTP."}
                  </p>
                  <div>
                    <Label>New Password</Label>
                    <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" />
                  </div>
                  <Button onClick={handleChangePassword} disabled={changingPass} className="w-full">
                    {changingPass ? "Saving..." : "Update Password"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="pt-2 border-t">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/auth");
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out All Devices
              </Button>
            </div>
          </div>
        </motion.div>

        <PinSetupCard />
        <ActiveSessions />

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BellIcon className="h-4 w-4" /> Notifications
          </div>
          <div className="space-y-3">
            {[
              { title: "Contribution reminders", desc: "SMS & in-app reminders before due dates" },
              { title: "Loan updates", desc: "Notifications about loan votes and approvals" },
              { title: "Transaction alerts", desc: "Real-time transaction notifications" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
