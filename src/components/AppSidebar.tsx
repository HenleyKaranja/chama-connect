import {
  LayoutDashboard,
  Users,
  Wallet,
  HandCoins,
  TrendingUp,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import logoImg from "/logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChamaMembership } from "@/hooks/use-chama-membership";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const allNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "treasurer", "member"] },
  { title: "My Chamas", url: "/dashboard/chamas", icon: Users, roles: ["admin", "treasurer", "member"] },
  { title: "Contributions", url: "/dashboard/contributions", icon: HandCoins, roles: ["admin", "treasurer", "member"] },
  { title: "Loans", url: "/dashboard/loans", icon: Landmark, roles: ["admin", "treasurer", "member"] },
  { title: "Wallet", url: "/dashboard/wallet", icon: Wallet, roles: ["admin", "treasurer"] },
  { title: "Investments", url: "/dashboard/investments", icon: TrendingUp, roles: ["admin", "treasurer", "member"] },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3, roles: ["admin", "treasurer"] },
  { title: "Admin Panel", url: "/dashboard/admin", icon: ShieldCheck, roles: ["admin"] },
];

const secondaryNav = [
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role, profile, signOut } = useAuth();

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const { hasChama } = useChamaMembership();

  // Members without chamas can only see Dashboard, Chamas, Notifications, Settings
  const chamaRequiredPaths = ["/dashboard/contributions", "/dashboard/loans", "/dashboard/wallet", "/dashboard/investments", "/dashboard/reports"];
  
  const visibleNav = allNav.filter((item) => {
    if (!role || !item.roles.includes(role)) return false;
    if (role !== "admin" && !hasChama && chamaRequiredPaths.includes(item.url)) return false;
    return true;
  });

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const roleBadge = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="M-Chama" className="h-12 w-12 shrink-0 rounded-lg object-contain brightness-0 invert" />
          {!collapsed && (
            <div>
              <div className="text-base font-bold tracking-tight text-sidebar-foreground">
                M-Chama
              </div>
              <p className="text-xs text-sidebar-foreground/60">Group Savings</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-wider">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="transition-colors duration-150"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-wider">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="transition-colors duration-150"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-primary">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || "Loading..."}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{roleBadge}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
