import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Landmark, Plus, CheckCircle2, Clock, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { Progress } from "@/components/ui/progress";

const loans = [
  {
    id: 1,
    member: "Amina Wanjiku",
    avatar: "AW",
    amount: "KES 25,000",
    interest: "5%",
    status: "Active",
    repaid: 60,
    repaidAmount: "KES 15,000",
    dueDate: "Jun 28, 2026",
  },
  {
    id: 2,
    member: "Peter Ochieng",
    avatar: "PO",
    amount: "KES 40,000",
    interest: "5%",
    status: "Voting",
    votes: { yes: 7, no: 2, total: 12 },
    requestDate: "Mar 20, 2026",
  },
  {
    id: 3,
    member: "Faith Akinyi",
    avatar: "FA",
    amount: "KES 15,000",
    interest: "5%",
    status: "Completed",
    repaid: 100,
    repaidAmount: "KES 15,750",
    completedDate: "Feb 14, 2026",
  },
  {
    id: 4,
    member: "David Mutua",
    avatar: "DM",
    amount: "KES 30,000",
    interest: "5%",
    status: "Rejected",
    reason: "Insufficient group funds",
    requestDate: "Jan 10, 2026",
  },
];

const statusColors = {
  Active: "text-info bg-info/10",
  Voting: "text-warning bg-warning/10",
  Completed: "text-success bg-success/10",
  Rejected: "text-destructive bg-destructive/10",
};

export default function Loans() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Loans</h1>
            <p className="text-muted-foreground mt-1">Manage loan applications and repayments</p>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Apply for Loan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Borrowed" value="KES 40,000" change="Lifetime" icon={Landmark} index={0} />
          <StatCard title="Outstanding" value="KES 10,000" change="1 active loan" changeType="neutral" icon={Clock} index={1} />
          <StatCard title="Pending Votes" value="1" change="Peter's loan request" changeType="neutral" icon={ThumbsUp} index={2} />
        </div>

        <div className="space-y-4">
          {loans.map((loan, i) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {loan.avatar}
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{loan.member}</p>
                      <p className="text-sm text-muted-foreground">
                        {loan.amount} · {loan.interest} interest
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[loan.status as keyof typeof statusColors]}`}>
                      {loan.status}
                    </span>
                  </div>

                  {loan.status === "Active" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Repaid: {loan.repaidAmount}</span>
                        <span>{loan.repaid}%</span>
                      </div>
                      <Progress value={loan.repaid} className="h-2" />
                      <p className="text-xs text-muted-foreground">Due: {loan.dueDate}</p>
                    </div>
                  )}

                  {loan.status === "Voting" && loan.votes && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-success">
                          <ThumbsUp className="h-4 w-4" /> {loan.votes.yes}
                        </span>
                        <span className="flex items-center gap-1 text-destructive">
                          <ThumbsDown className="h-4 w-4" /> {loan.votes.no}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {loan.votes.yes + loan.votes.no} of {loan.votes.total} voted
                        </span>
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                        </Button>
                        <Button size="sm" className="text-xs h-7">
                          <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                  )}

                  {loan.status === "Completed" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      Fully repaid on {loan.completedDate} · Total: {loan.repaidAmount}
                    </p>
                  )}

                  {loan.status === "Rejected" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-destructive" />
                      {loan.reason} · Requested {loan.requestDate}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedPage>
  );
}
