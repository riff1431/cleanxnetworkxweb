import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CalendarCheck, 
  Settings, 
  Shield,
  LogOut,
  Home,
  CreditCard,
  BadgeCheck,
  Crown,
  Zap,
  Paintbrush,
  ShoppingBag,
  FileQuestion,
  MessageSquare,
  Bell,
  FileText,
  Wallet,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo-new.png";

const overviewItems = [
  { title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard },
];

const managementItems = [
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Cleaners", url: "/admin/cleaners", icon: Briefcase },
  { title: "Verification", url: "/admin/verification", icon: Shield },
  { title: "Bookings", url: "/admin/bookings", icon: CalendarCheck },
  { title: "Jobs", url: "/admin/jobs", icon: Briefcase },
  { title: "Service Listings", url: "/admin/service-listings", icon: ShoppingBag },
  { title: "Quote Requests", url: "/admin/quotes", icon: FileQuestion },
  { title: "Conversations", url: "/admin/messages", icon: MessageSquare },
];

const promotionItems = [
  { title: "Cleaner of the Week", url: "/admin/cleaner-of-the-week", icon: Crown },
  { title: "Sponsored Spotlight", url: "/admin/sponsored", icon: Zap },
  { title: "Subscription Plans", url: "/admin/subscriptions", icon: Crown },
];

const financeItems = [
  { title: "Subscription Payments", url: "/admin/subscription-verification", icon: BadgeCheck },
  { title: "Payment Gateway", url: "/admin/payment-gateway", icon: CreditCard },
  { title: "Payment Verification", url: "/admin/payment-verification", icon: BadgeCheck },
  { title: "Invoices", url: "/admin/invoices", icon: FileText },
  { title: "Wallets", url: "/admin/wallets", icon: Wallet },
];

const systemItems = [
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Theme Management", url: "/admin/theme", icon: Paintbrush },
];

const AdminDashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [logo, setLogo] = useState(defaultLogo);

  useEffect(() => {
    supabase
      .from("theme_settings")
      .select("setting_value")
      .eq("setting_key", "logo_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) setLogo(data.setting_value);
      });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const renderMenuItems = (items: typeof overviewItems) => (
    <SidebarMenu>
      {items.map((item) => {
        const active = isActive(item.url);
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              onClick={() => navigate(item.url)}
              className={cn(
                "w-full justify-start gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-normal",
                active
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary-foreground" : "text-foreground/50")} />
              <span className="truncate">{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar
      className="border-r border-border/40 [&_[data-sidebar=sidebar]]:!bg-card"
      style={{
        "--sidebar-accent": "var(--primary)",
        "--sidebar-accent-foreground": "var(--primary-foreground)",
      } as React.CSSProperties}
    >
      <SidebarContent className="px-3 pt-5 pb-2" style={{ background: "transparent" }}>
        {/* Logo & Admin Badge */}
        <div className="px-3 mb-6 flex items-center gap-2.5">
          <img src={logo} alt="Logo" className="h-8 w-auto rounded" />
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-destructive" />
            <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Admin</span>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(overviewItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(managementItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            Promotions
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(promotionItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            Finance
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(financeItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(systemItems)}</SidebarGroupContent>
        </SidebarGroup>

        {/* Quick link */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/")}
                  className="w-full justify-start gap-3 px-3 py-2 rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground text-sm font-normal"
                >
                  <Home className="h-[18px] w-[18px] shrink-0 text-foreground/50" />
                  <span>Back to Site</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/30" style={{ background: "transparent" }}>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-foreground/50 hover:text-destructive hover:bg-destructive/8 transition-colors text-sm"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminDashboardSidebar;
