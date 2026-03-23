import { AnimatedPage, StaggerContainer, staggerItem } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Users, Plus, Copy, MoreVertical, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const chamas = [
  {
    id: 1,
    name: "Umoja Savings Circle",
    members: 12,
    balance: "KES 234,500",
    contribution: "KES 5,000/month",
    role: "Admin",
    nextDue: "Mar 28",
    color: "from-primary/20 to-primary/5",
  },
  {
    id: 2,
    name: "Maendeleo Investment",
    members: 8,
    balance: "KES 156,800",
    contribution: "KES 3,000/month",
    role: "Treasurer",
    nextDue: "Apr 1",
    color: "from-accent/20 to-accent/5",
  },
  {
    id: 3,
    name: "Harambee Women's Group",
    members: 15,
    balance: "KES 412,000",
    contribution: "KES 2,000/week",
    role: "Member",
    nextDue: "Mar 25",
    color: "from-info/20 to-info/5",
  },
];

export default function Chamas() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Chamas</h1>
            <p className="text-muted-foreground mt-1">Manage your savings groups</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Join with Code
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Chama
            </Button>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {chamas.map((chama) => (
            <motion.div
              key={chama.id}
              variants={staggerItem}
              className="group rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
            >
              <div className={`h-24 bg-gradient-to-br ${chama.color} p-5 flex items-start justify-between`}>
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm">
                    {chama.role === "Admin" && <Crown className="h-3 w-3" />}
                    {chama.role === "Treasurer" && <Shield className="h-3 w-3" />}
                    {chama.role}
                  </span>
                </div>
                <button className="p-1 rounded-md hover:bg-card/50 transition-colors">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold">{chama.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3" />
                    <span>{chama.members} members</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-sm font-semibold tabular-nums">{chama.balance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contribution</p>
                    <p className="text-sm font-semibold tabular-nums">{chama.contribution}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="text-xs text-muted-foreground">Next due: {chama.nextDue}</p>
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    View →
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </AnimatedPage>
  );
}
