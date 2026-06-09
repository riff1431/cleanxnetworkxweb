import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  DollarSign, 
  Settings, 
  ClipboardList,
  LogOut,
  Crown,
  Zap,
  ShoppingBag,
  FileQuestion,
  FileText,
  MessageSquare,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo-new.png";

const mainMenuItems = [
  { title: "Overview", url: "/cleaner/dashboard", icon: LayoutDashboard },
  { title: "My Profile", url: "/cleaner/profile", icon: User },
  { title: "Verification", url: "/cleaner/verification", icon: ShieldCheck },
];

const serviceMenuItems = [
  { title: "My Services", url: "/cleaner/services", icon: ShoppingBag },
  { title: "Booking Requests", url: "/cleaner/bookings", icon: ClipboardList },
  { title: "Quote Requests", url: "/cleaner/quotes", icon: FileQuestion },
  { title: "Messages", url: "/cleaner/messages", icon: MessageSquare },
  { title: "My Schedule", url: "/cleaner/schedule", icon: Calendar },
];

const financeMenuItems = [
  { title: "Invoices", url: "/cleaner/invoices", icon: FileText },
  { title: "Wallet", url: "/cleaner/wallet", icon: Wallet },
  { title: "Earnings", url: "/cleaner/earnings", icon: DollarSign },
];

const upgradeMenuItems = [
  { title: "Membership", url: "/cleaner/subscription", icon: Crown },
  { title: "Sponsored Spotlight", url: "/cleaner/sponsorship", icon: Zap },
  { title: "Settings", url: "/cleaner/settings", icon: Settings },
];

const CleanerDashboardSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const unreadCount = useUnreadMessages();
  const { status: verificationStatus, hasRejection } = useVerificationStatus();

  const isActive = (path: string) => {
    if (path === "/cleaner/dashboard") {
      return location.pathname === "/cleaner/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const renderMenuItems = (items: typeof mainMenuItems) => (
    <SidebarMenu>
      {items.map((item) => {
        const active = isActive(item.url);
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={item.title}
              className={`
                rounded-lg px-3 py-2 transition-all duration-150 text-sm font-normal
                ${active
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <NavLink
                to={item.url}
                end={item.url === "/cleaner/dashboard"}
                className="flex items-center gap-3"
                activeClassName=""
              >
                <div className="relative shrink-0">
                  <item.icon className={`h-[18px] w-[18px] ${active ? "text-primary-foreground" : "text-foreground/50"}`} />
                  {item.title === "Verification" && hasRejection && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
                  )}
                </div>
                <span className="truncate">{item.title}</span>
                {item.title === "Messages" && unreadCount > 0 && (
                  <Badge variant={active ? "secondary" : "destructive"} className="ml-auto h-5 min-w-5 px-1.5 text-[10px] justify-center rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
                {item.title === "Verification" && verificationStatus !== "not_started" && (
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={`ml-auto h-5 px-1.5 text-[10px] rounded-full border-0 ${
                      verificationStatus === "approved"
                        ? "bg-blue-500/15 text-blue-600"
                        : verificationStatus === "rejected"
                        ? "bg-destructive/15 text-destructive"
                        : verificationStatus === "pending"
                        ? "bg-yellow-500/15 text-yellow-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {verificationStatus === "approved"
                      ? "Verified"
                      : verificationStatus === "rejected"
                      ? "Rejected"
                      : verificationStatus === "pending"
                      ? "Pending"
                      : "Incomplete"}
                  </Badge>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40 [&_[data-sidebar=sidebar]]:!bg-card"
      style={{
        "--sidebar-accent": "var(--primary)",
        "--sidebar-accent-foreground": "var(--primary-foreground)",
      } as React.CSSProperties}
    >
      <SidebarContent className="px-3 pt-5 pb-2" style={{ background: "transparent" }}>
        {/* Logo */}
        {!collapsed && (
          <div className="px-3 mb-6 flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="h-8 w-auto rounded" />
            <span className="font-heading font-semibold text-foreground text-sm tracking-tight">
              Cleaner Portal
            </span>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(mainMenuItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            Services
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(serviceMenuItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            Finance
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(financeMenuItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            Upgrade & Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(upgradeMenuItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className="p-3 border-t border-border/30"
        style={{ background: "transparent" }}
      >
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-foreground/50 hover:text-destructive hover:bg-destructive/8 transition-colors text-sm"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CleanerDashboardSidebar;
