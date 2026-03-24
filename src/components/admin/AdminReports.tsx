import { FileText, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const reports = [
  { name: "Monthly Financial Summary", period: "March 2026", type: "Financial", generated: "Mar 20, 2026" },
  { name: "Member Contributions Report", period: "Q1 2026", type: "Contributions", generated: "Mar 18, 2026" },
  { name: "Loan Portfolio Analysis", period: "March 2026", type: "Loans", generated: "Mar 15, 2026" },
  { name: "Merry-Go-Round Status", period: "2026 Cycle", type: "MGR", generated: "Mar 10, 2026" },
  { name: "Annual Audit Report", period: "2025", type: "Audit", generated: "Jan 15, 2026" },
];

export function AdminReports() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Generated Reports
        </h3>
        <Button size="sm" variant="outline">
          <Calendar className="h-3.5 w-3.5 mr-1" /> Generate New Report
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm divide-y">
        {reports.map((report, i) => (
          <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{report.name}</p>
              <p className="text-xs text-muted-foreground">{report.period} • Generated {report.generated}</p>
            </div>
            <Badge variant="secondary" className="text-xs">{report.type}</Badge>
            <Button size="sm" variant="ghost">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
