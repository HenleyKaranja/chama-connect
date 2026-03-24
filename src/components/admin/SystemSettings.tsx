import { Settings, Shield, Bell, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function SystemSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* General */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" /> General Settings
        </h3>
        <div className="grid gap-4">
          <div>
            <Label>Group Name</Label>
            <Input defaultValue="M-Chama Savings Group" />
          </div>
          <div>
            <Label>Monthly Contribution Amount (KES)</Label>
            <Input type="number" defaultValue="5000" />
          </div>
          <div>
            <Label>Contribution Due Date</Label>
            <Input type="number" defaultValue="28" placeholder="Day of month" />
          </div>
        </div>
      </div>

      {/* Financial */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Financial Settings
        </h3>
        <div className="grid gap-4">
          <div>
            <Label>Loan Interest Rate (%)</Label>
            <Input type="number" defaultValue="10" />
          </div>
          <div>
            <Label>Maximum Loan Amount (KES)</Label>
            <Input type="number" defaultValue="100000" />
          </div>
          <div>
            <Label>Loan Repayment Period (months)</Label>
            <Input type="number" defaultValue="6" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Late Payment Penalty</p>
              <p className="text-xs text-muted-foreground">Charge penalty on late contributions</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4" /> Notification Settings
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Contribution Reminders</p>
              <p className="text-xs text-muted-foreground">Send reminders 3 days before due date</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Loan Approval Notifications</p>
              <p className="text-xs text-muted-foreground">Notify members on loan status changes</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Member Alerts</p>
              <p className="text-xs text-muted-foreground">Alert admins when new members sign up</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" /> Security
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Require Approval for New Members</p>
              <p className="text-xs text-muted-foreground">Admin must approve before members can access</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      <Button className="w-full">Save Settings</Button>
    </div>
  );
}
