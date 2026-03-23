import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { User, Shield, Bell as BellIcon, Palette, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences</p>
        </div>

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="rounded-xl border bg-card p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4" /> Profile
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              AW
            </div>
            <div>
              <p className="font-semibold">Amina Wanjiku</p>
              <p className="text-sm text-muted-foreground">amina.wanjiku@email.com</p>
              <p className="text-xs text-muted-foreground mt-0.5">+254 712 345 678</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Edit Profile</Button>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="rounded-xl border bg-card p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4" /> Security
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Add extra security to your account</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">M-Pesa PIN verification</p>
                <p className="text-xs text-muted-foreground">Require PIN for transactions</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
          <Button variant="outline" size="sm">Change Password</Button>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="rounded-xl border bg-card p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BellIcon className="h-4 w-4" /> Notifications
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Contribution reminders</p>
                <p className="text-xs text-muted-foreground">SMS & in-app reminders before due dates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Loan updates</p>
                <p className="text-xs text-muted-foreground">Notifications about loan votes and approvals</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Transaction alerts</p>
                <p className="text-xs text-muted-foreground">Real-time transaction notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
