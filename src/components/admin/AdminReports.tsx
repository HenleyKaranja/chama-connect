import { useState } from "react";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ReportType = "contributions" | "loans" | "members" | "financial";

export function AdminReports() {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("contributions");
  const [generatedReports, setGeneratedReports] = useState<
    { name: string; type: string; data: string; generated: string }[]
  >([]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      let csvContent = "";
      let reportName = "";

      if (reportType === "contributions") {
        reportName = "Contributions Report";
        const { data } = await supabase.from("contributions").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          csvContent = "ID,Chama ID,User ID,Amount,Status,Payment Method,Notes,Created At\n";
          csvContent += data.map(r => `${r.id},${r.chama_id},${r.user_id},${r.amount},${r.status},${r.payment_method || ""},${r.notes || ""},${r.created_at}`).join("\n");
        }
      } else if (reportType === "loans") {
        reportName = "Loans Report";
        const { data } = await supabase.from("loans").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          csvContent = "ID,Chama ID,User ID,Amount,Interest Rate,Repaid Amount,Status,Due Date,Created At\n";
          csvContent += data.map(r => `${r.id},${r.chama_id},${r.user_id},${r.amount},${r.interest_rate},${r.repaid_amount},${r.status},${r.due_date || ""},${r.created_at}`).join("\n");
        }
      } else if (reportType === "members") {
        reportName = "Members Report";
        const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          csvContent = "ID,User ID,Full Name,Phone,Approved,Created At\n";
          csvContent += data.map(r => `${r.id},${r.user_id},${r.full_name},${r.phone || ""},${r.is_approved},${r.created_at}`).join("\n");
        }
      } else if (reportType === "financial") {
        reportName = "Financial Summary";
        const [{ data: contributions }, { data: loans }] = await Promise.all([
          supabase.from("contributions").select("amount, status"),
          supabase.from("loans").select("amount, status, repaid_amount, interest_rate"),
        ]);
        const totalContributions = contributions?.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0) ?? 0;
        const totalLoans = loans?.filter(l => ["active", "completed"].includes(l.status)).reduce((s, l) => s + Number(l.amount), 0) ?? 0;
        const totalRepaid = loans?.reduce((s, l) => s + Number(l.repaid_amount), 0) ?? 0;
        csvContent = "Metric,Value\n";
        csvContent += `Total Contributions,KES ${totalContributions}\n`;
        csvContent += `Total Loans Issued,KES ${totalLoans}\n`;
        csvContent += `Total Repaid,KES ${totalRepaid}\n`;
        csvContent += `Outstanding,KES ${totalLoans - totalRepaid}\n`;
      }

      if (!csvContent) {
        toast.info("No data available for this report");
        setGenerating(false);
        return;
      }

      // Trigger download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setGeneratedReports(prev => [{
        name: reportName,
        type: reportType,
        data: csvContent,
        generated: new Date().toLocaleString(),
      }, ...prev]);

      toast.success(`${reportName} generated and downloaded`);
    } catch {
      toast.error("Failed to generate report");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4" /> Generate Report
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Report Type</label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contributions">Contributions Report</SelectItem>
                <SelectItem value="loans">Loans Report</SelectItem>
                <SelectItem value="members">Members Report</SelectItem>
                <SelectItem value="financial">Financial Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateReport} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Generate & Download
          </Button>
        </div>
      </div>

      {generatedReports.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm divide-y">
          <div className="p-4">
            <h3 className="font-semibold text-sm">Recently Generated</h3>
          </div>
          {generatedReports.map((report, i) => (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{report.name}</p>
                <p className="text-xs text-muted-foreground">Generated {report.generated}</p>
              </div>
              <Badge variant="secondary" className="text-xs capitalize">{report.type}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
