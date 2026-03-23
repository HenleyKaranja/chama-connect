import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Bell, CheckCheck, HandCoins, Landmark, Users, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const notifications = [
  { id: 1, icon: HandCoins, title: "Contribution reminder", message: "Your Harambee Women's Group contribution of KES 2,000 is due on Mar 28.", time: "2 hours ago", read: false, type: "reminder" },
  { id: 2, icon: ThumbsUp, title: "Vote required", message: "Peter Ochieng has requested a loan of KES 40,000 from Umoja Savings Circle. Cast your vote.", time: "5 hours ago", read: false, type: "action" },
  { id: 3, icon: Landmark, title: "Loan repayment received", message: "Your loan repayment of KES 12,000 has been recorded for Umoja Savings.", time: "Yesterday", read: true, type: "info" },
  { id: 4, icon: Users, title: "New member joined", message: "Sarah Wambui has joined Maendeleo Investment group.", time: "Yesterday", read: true, type: "info" },
  { id: 5, icon: HandCoins, title: "Contribution received", message: "Grace Muthoni contributed KES 5,000 to Umoja Savings Circle.", time: "2 days ago", read: true, type: "info" },
  { id: 6, icon: Landmark, title: "Loan approved", message: "Your loan request of KES 25,000 has been approved by Umoja members.", time: "3 days ago", read: true, type: "success" },
];

export default function Notifications() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1">Stay updated on your chama activity</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
          </Button>
        </div>

        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors hover:bg-muted/30 ${!n.read ? "bg-primary/[0.03] border-primary/20" : "bg-card"}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                <n.icon className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent mt-1.5" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{n.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedPage>
  );
}
