import { useState } from "react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { MemberApprovals } from "@/components/admin/MemberApprovals";
import { LoanApprovals } from "@/components/admin/LoanApprovals";
import { ChamaApprovals } from "@/components/admin/ChamaApprovals";
import { AllMembers } from "@/components/admin/AllMembers";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { FinancialInsights } from "@/components/admin/FinancialInsights";
import { MerryGoRound } from "@/components/admin/MerryGoRound";
import { AdminReports } from "@/components/admin/AdminReports";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { PaymentApprovals } from "@/components/admin/PaymentApprovals";
import { AuditTracker } from "@/components/admin/AuditTracker";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { PenaltiesManager } from "@/components/admin/PenaltiesManager";
import { SEO } from "@/components/SEO";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AnimatedPage>
      <SEO title="Admin Dashboard" description="Approve members, chamas, payments and loans, manage projects, cycles, penalties and view audit logs." path="/dashboard/admin" noindex />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage members, projects, finances and system settings.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="approvals" className="text-xs">Member Approvals</TabsTrigger>
            <TabsTrigger value="loan-approvals" className="text-xs">Loan Approvals</TabsTrigger>
            <TabsTrigger value="chama-approvals" className="text-xs">Chama Requests</TabsTrigger>
            <TabsTrigger value="payment-approvals" className="text-xs">Payment Approvals</TabsTrigger>
            <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs">Projects</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">Financial Insights</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
            <TabsTrigger value="merry-go-round" className="text-xs">Merry-Go-Round</TabsTrigger>
            <TabsTrigger value="penalties" className="text-xs">Penalties</TabsTrigger>
            <TabsTrigger value="audit-trail" className="text-xs">Audit Trail</TabsTrigger>
            <TabsTrigger value="activity-logs" className="text-xs">Activity Logs</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="approvals"><MemberApprovals /></TabsContent>
          <TabsContent value="loan-approvals"><LoanApprovals /></TabsContent>
          <TabsContent value="chama-approvals"><ChamaApprovals /></TabsContent>
          <TabsContent value="payment-approvals"><PaymentApprovals /></TabsContent>
          <TabsContent value="members"><AllMembers /></TabsContent>
          <TabsContent value="projects"><ProjectsManager /></TabsContent>
          <TabsContent value="insights"><FinancialInsights /></TabsContent>
          <TabsContent value="analytics"><AdminCharts /></TabsContent>
          <TabsContent value="merry-go-round"><MerryGoRound /></TabsContent>
          <TabsContent value="penalties"><PenaltiesManager /></TabsContent>
          <TabsContent value="audit-trail"><AuditTracker /></TabsContent>
          <TabsContent value="activity-logs"><ActivityLogs /></TabsContent>
          <TabsContent value="reports"><AdminReports /></TabsContent>
          <TabsContent value="settings"><SystemSettings /></TabsContent>
        </Tabs>
      </div>
    </AnimatedPage>
  );
}
