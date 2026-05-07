import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { differenceInMonths } from "date-fns";

interface EligibilityCheck {
  label: string;
  passed: boolean;
  detail: string;
}

interface Props {
  chamaId: string;
}

export function LoanEligibility({ chamaId }: Props) {
  const { user } = useAuth();

  const { data: membership } = useQuery({
    queryKey: ["membership_for_eligibility", user?.id, chamaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chama_members")
        .select("joined_at, status")
        .eq("user_id", user!.id)
        .eq("chama_id", chamaId)
        .single();
      return data;
    },
    enabled: !!user && !!chamaId,
  });

  const { data: contributions } = useQuery({
    queryKey: ["contributions_for_eligibility", user?.id, chamaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("contributions")
        .select("amount, status, created_at")
        .eq("user_id", user!.id)
        .eq("chama_id", chamaId)
        .eq("status", "paid");
      return data ?? [];
    },
    enabled: !!user && !!chamaId,
  });

  const { data: activeLoans } = useQuery({
    queryKey: ["active_loans_eligibility", user?.id, chamaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("loans")
        .select("id, amount, repaid_amount, status")
        .eq("user_id", user!.id)
        .eq("chama_id", chamaId)
        .in("status", ["active", "pending"]);
      return data ?? [];
    },
    enabled: !!user && !!chamaId,
  });

  if (!chamaId) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" /> Select a chama to check loan eligibility.
      </div>
    );
  }

  const checks: EligibilityCheck[] = [];

  // 1. Active membership
  const isActive = membership?.status === "active";
  checks.push({
    label: "Active Membership",
    passed: isActive,
    detail: isActive ? "You are an active member" : "You must be an active member",
  });

  // 2. Minimum membership duration (3 months)
  const monthsJoined = membership ? differenceInMonths(new Date(), new Date(membership.joined_at)) : 0;
  const hasMinDuration = monthsJoined >= 3;
  checks.push({
    label: "3+ Months Membership",
    passed: hasMinDuration,
    detail: hasMinDuration ? `Member for ${monthsJoined} months` : `Only ${monthsJoined} month(s) — need 3+`,
  });

  // 3. Minimum contributions (at least 3 paid)
  const paidCount = contributions?.length ?? 0;
  const hasMinContributions = paidCount >= 3;
  checks.push({
    label: "3+ Paid Contributions",
    passed: hasMinContributions,
    detail: hasMinContributions ? `${paidCount} contributions made` : `Only ${paidCount} — need 3+`,
  });

  // 4. No existing active/pending loan
  const hasExistingLoan = (activeLoans?.length ?? 0) > 0;
  checks.push({
    label: "No Existing Active Loan",
    passed: !hasExistingLoan,
    detail: hasExistingLoan ? `You have ${activeLoans?.length} active/pending loan(s)` : "No outstanding loans",
  });

  // 5. Calculate max eligible amount (3x total contributions)
  const totalContributed = contributions?.reduce((s, c) => s + Number(c.amount), 0) ?? 0;
  const maxLoanAmount = totalContributed * 3;

  const allPassed = checks.every((c) => c.passed);

  return (
    <div className="space-y-3">
      <div className={`rounded-lg border p-4 ${allPassed ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
        <div className="flex items-center gap-2 mb-3">
          {allPassed ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
          <span className="font-semibold text-sm">
            {allPassed ? "You are eligible for a loan!" : "Eligibility requirements not met"}
          </span>
        </div>

        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-2 text-sm">
              {check.passed ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span className="font-medium">{check.label}</span>
              <span className="text-muted-foreground ml-auto text-xs">{check.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {allPassed && (
        <div className="rounded-lg border bg-card p-3 text-sm">
          <p className="text-muted-foreground">
            Maximum eligible loan amount:{" "}
            <span className="font-bold text-foreground">KES {maxLoanAmount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-1">(3× your total contributions)</span>
          </p>
        </div>
      )}
    </div>
  );
}
