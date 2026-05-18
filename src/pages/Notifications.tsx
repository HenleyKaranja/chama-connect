import { useEffect, useState } from "react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Bell, CheckCheck, HandCoins, Landmark, Users, ThumbsUp, Info, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SEO } from "@/components/SEO";

const iconMap: Record<string, typeof Bell> = {
  info: Info,
  success: CheckCircle,
  error: AlertCircle,
  reminder: HandCoins,
  action: ThumbsUp,
  loan: Landmark,
  member: Users,
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;
    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <AnimatedPage>
      <SEO title="Notifications" description="Stay updated on Chama activity — contributions, loan approvals, cycle payouts and group events." path="/dashboard/notifications" noindex />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1">Stay updated on your chama activity</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
            <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold">No notifications yet</h3>
            <p className="text-sm text-muted-foreground mt-1">You'll see updates about your chamas here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const Icon = iconMap[n.type] || Bell;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-colors hover:bg-muted/30 ${!n.is_read ? "bg-primary/[0.03] border-primary/20" : "bg-card"}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${!n.is_read ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                      {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent mt-1.5" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
