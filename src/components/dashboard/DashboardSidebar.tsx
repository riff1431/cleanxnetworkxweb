import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LogOut,
  LayoutDashboard,
  User
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import defaultAvatar from "@/assets/default-avatar.png";
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
import logo from "@/assets/logo-new.png";
import {
  AnimatedCalendar,
  AnimatedMapPin,
  AnimatedWallet,
  AnimatedBriefcase,
  AnimatedCrown,
  AnimatedFileText,
  AnimatedFileQuestion,
  AnimatedSettings,
  AnimatedMessage,
  AnimatedHistory
} from "@/components/dashboard/AnimatedIcons";
import { motion } from "framer-motion";

// Inline motion icon wrappers for sidebar items that aren't defined in AnimatedIcons.tsx
const AnimatedDashboardIcon = () => (
  <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ type: "spring", stiffness: 400 }}>
    <LayoutDashboard className="h-4.5 w-4.5" />
  </motion.div>
);

const AnimatedUserIcon = () => (
  <motion.div whileHover={{ scale: 1.2, y: -2 }} transition={{ type: "spring", stiffness: 400 }}>
    <User className="h-4.5 w-4.5" />
  </motion.div>
);

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: AnimatedDashboardIcon, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10" },
  { title: "Profile", url: "/dashboard/profile", icon: AnimatedUserIcon, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/10" },
];

const serviceMenuItems = [
  { title: "My Jobs", url: "/dashboard/my-jobs", icon: AnimatedBriefcase, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/10" },
  { title: "My Quotes", url: "/dashboard/quotes", icon: AnimatedFileQuestion, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10" },
  { title: "Upcoming", url: "/dashboard/upcoming", icon: AnimatedCalendar, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10" },
  { title: "Booking History", url: "/dashboard/history", icon: AnimatedHistory, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/10" },
  { title: "Messages", url: "/dashboard/messages", icon: AnimatedMessage, color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/10" },
];

const financeMenuItems = [
  { title: "Invoices", url: "/dashboard/invoices", icon: AnimatedFileText, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10" },
  { title: "Wallet", url: "/dashboard/wallet", icon: AnimatedWallet, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/10" },
  { title: "Membership", url: "/dashboard/subscription", icon: AnimatedCrown, color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/10" },
];

const settingsMenuItems = [
  { title: "Addresses", url: "/dashboard/addresses", icon: AnimatedMapPin, color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10" },
  { title: "Settings", url: "/dashboard/settings", icon: AnimatedSettings, color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/10" },
];

const DashboardSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const unreadCount = useUnreadMessages();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const renderMenuItems = (items: typeof mainMenuItems) => (
    <SidebarMenu className="space-y-1">
      {items.map((item) => {
        const active = isActive(item.url);
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={item.title}
              className={`
                group/item rounded-xl px-3 py-2.5 transition-all duration-300 text-sm font-medium relative overflow-hidden
                ${active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 border-0"
                  : "text-foreground/75 hover:bg-muted/70 hover:text-foreground hover:translate-x-1.5"
                }
              `}
            >
              <NavLink
                to={item.url}
                end={item.url === "/dashboard"}
                className="flex items-center gap-3 w-full"
                activeClassName=""
              >
                {/* Active left bar indicator */}
                {active && (
                  <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-md bg-secondary animate-fade-in" />
                )}

                {/* Animated Icon Panel Wrapper */}
                <div className={`p-1.5 rounded-lg transition-colors duration-300 flex items-center justify-center shrink-0 border ${
                  active 
                    ? "bg-white/20 text-white border-transparent" 
                    : `${item.color} border-current/5`
                }`}>
                  <Icon />
                </div>

                <span className={`truncate tracking-wide transition-colors ${active ? "font-bold" : "text-foreground/80 group-hover/item:text-foreground"}`}>
                  {item.title}
                </span>

                {item.title === "Messages" && unreadCount > 0 && (
                  <Badge variant={active ? "secondary" : "destructive"} className="ml-auto h-5 min-w-5 px-1.5 text-[10px] justify-center rounded-full shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
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
      className="border-r border-border/30 dark:border-indigo-950/20 bg-gradient-to-b from-card via-card/98 to-muted/20 backdrop-blur-md"
      style={{
        "--sidebar-accent": "var(--primary)",
        "--sidebar-accent-foreground": "var(--primary-foreground)",
      } as React.CSSProperties}
    >
      <SidebarContent className="px-3 pt-5 pb-2" style={{ background: "transparent" }}>
        {/* Logo block */}
        {!collapsed && (
          <div className="px-3 mb-6 mt-1 flex items-center gap-3">
            <div className="p-1 rounded-xl bg-card border border-border/40 shadow-sm flex items-center justify-center shrink-0">
              <img src={logo} alt="Logo" className="h-7 w-auto object-contain" />
            </div>
            <span className="font-heading font-black text-sm tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              THE CLEANING NETWORK
            </span>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-bold text-foreground/45 dark:text-foreground/35 uppercase tracking-[0.18em] px-3 mb-1.5">
            Home
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(mainMenuItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[9px] font-bold text-foreground/45 dark:text-foreground/35 uppercase tracking-[0.18em] px-3 mb-1.5">
            Services
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(serviceMenuItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[9px] font-bold text-foreground/45 dark:text-foreground/35 uppercase tracking-[0.18em] px-3 mb-1.5">
            Finance
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(financeMenuItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[9px] font-bold text-foreground/45 dark:text-foreground/35 uppercase tracking-[0.18em] px-3 mb-1.5">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(settingsMenuItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className="p-3 border-t border-border/20 bg-muted/10"
        style={{ background: "transparent" }}
      >
        {!collapsed ? (
          <div className="bg-card/45 backdrop-blur-sm p-2.5 rounded-xl border border-border/30 flex items-center justify-between gap-3 w-full relative group">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-8 w-8 ring-2 ring-border/20">
                <AvatarImage src={profile?.avatar_url || defaultAvatar} alt="Profile" className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-bold">
                  {(profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-foreground truncate leading-tight">
                  {profile?.full_name || user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
                  Finder / Customer
                </p>
              </div>
            </div>
            
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center w-full py-1">
            <Avatar className="h-8 w-8 ring-2 ring-border/20 cursor-pointer" onClick={signOut} title="Click to Sign Out">
              <AvatarImage src={profile?.avatar_url || defaultAvatar} alt="Profile" className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-bold">
                {(profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
