import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, LayoutGrid, MessageSquare, User, X, Home, Briefcase, CalendarDays, FileText, Settings, Shield } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import defaultAvatar from "@/assets/default-avatar.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderBarProps {
  variant?: "customer" | "cleaner" | "admin";
  messagesPath?: string;
  profilePath?: string;
}

const quickLinks = {
  customer: [
    { label: "Home", href: "/", icon: Home, color: "bg-primary/10 text-primary" },
    { label: "Find Cleaners", href: "/search", icon: Search, color: "bg-secondary/15 text-secondary" },
    { label: "My Jobs", href: "/dashboard/my-jobs", icon: Briefcase, color: "bg-accent/15 text-accent-foreground" },
    { label: "Bookings", href: "/dashboard/upcoming", icon: CalendarDays, color: "bg-success/15 text-success" },
    { label: "Invoices", href: "/dashboard/invoices", icon: FileText, color: "bg-warning/15 text-warning" },
    { label: "Settings", href: "/dashboard/settings", icon: Settings, color: "bg-muted text-foreground/60" },
  ],
  cleaner: [
    { label: "Home", href: "/", icon: Home, color: "bg-primary/10 text-primary" },
    { label: "My Services", href: "/cleaner/services", icon: Briefcase, color: "bg-secondary/15 text-secondary" },
    { label: "Bookings", href: "/cleaner/bookings", icon: CalendarDays, color: "bg-success/15 text-success" },
    { label: "Earnings", href: "/cleaner/earnings", icon: FileText, color: "bg-warning/15 text-warning" },
    { label: "Schedule", href: "/cleaner/schedule", icon: CalendarDays, color: "bg-info/15 text-info" },
    { label: "Settings", href: "/cleaner/settings", icon: Settings, color: "bg-muted text-foreground/60" },
  ],
  admin: [
    { label: "Home", href: "/", icon: Home, color: "bg-primary/10 text-primary" },
    { label: "Users", href: "/admin/users", icon: User, color: "bg-info/15 text-info" },
    { label: "Cleaners", href: "/admin/cleaners", icon: Briefcase, color: "bg-secondary/15 text-secondary" },
    { label: "Bookings", href: "/admin/bookings", icon: CalendarDays, color: "bg-success/15 text-success" },
    { label: "Payments", href: "/admin/payment-verification", icon: FileText, color: "bg-warning/15 text-warning" },
    { label: "Settings", href: "/admin/settings", icon: Settings, color: "bg-destructive/10 text-destructive" },
  ],
};

/** Shared icon button style */
const iconBtn =
  "relative p-2 rounded-xl text-foreground/55 transition-all duration-200 hover:text-primary hover:bg-primary/8 hover:shadow-sm active:scale-95";

const iconBtnAdmin =
  "relative p-2 rounded-xl text-foreground/55 transition-all duration-200 hover:text-destructive hover:bg-destructive/8 hover:shadow-sm active:scale-95";

const DashboardHeaderBar = ({
  variant = "customer",
  messagesPath = "/dashboard/messages",
  profilePath = "/dashboard/profile",
}: DashboardHeaderBarProps) => {
  const { user } = useAuth();
  const unreadCount = useUnreadMessages();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    const name = user.user_metadata?.full_name;
    if (name) return name.charAt(0).toUpperCase();
    return (user.email?.charAt(0) || "U").toUpperCase();
  };

  const isAdmin = variant === "admin";
  const btnClass = isAdmin ? iconBtnAdmin : iconBtn;
  const links = quickLinks[variant];

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-border/20 bg-card/95 backdrop-blur-sm px-3 md:px-5">
      {/* Left side */}
      <div className="flex items-center gap-1">
        <SidebarTrigger className={btnClass} />

        {/* Apps Grid Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`${btnClass} hidden md:flex`} title="Quick Links">
              <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-2 rounded-xl shadow-lg border border-border/30">
            <div className="grid grid-cols-3 gap-1.5">
              {links.map((link) => (
                <DropdownMenuItem key={link.href} asChild className="flex-col items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-muted/60 focus:bg-muted/60 transition-colors">
                  <Link to={link.href}>
                    <div className={`p-2.5 rounded-xl ${link.color} transition-transform duration-150 hover:scale-110`}>
                      <link.icon className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground/60 text-center leading-tight">{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex items-center ml-1.5">
            <div className="flex items-center gap-2 bg-muted/50 border border-border/30 rounded-xl px-3 py-1.5 shadow-inner">
              <Search className="h-4 w-4 text-primary/60 shrink-0" strokeWidth={1.8} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cleaners, services..."
                className="bg-transparent text-sm text-foreground placeholder:text-foreground/35 outline-none w-40 md:w-56"
              />
              <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="p-1 rounded-lg hover:bg-foreground/8 transition-colors">
                <X className="h-3.5 w-3.5 text-foreground/40" strokeWidth={2} />
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className={btnClass}
            title="Search"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {isAdmin && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-destructive/8 border border-destructive/15 mr-1">
            <Shield className="h-3.5 w-3.5 text-destructive" strokeWidth={2} />
            <span className="text-[10px] font-bold text-destructive hidden md:inline uppercase tracking-wider">Admin</span>
          </div>
        )}

        {/* Messages */}
        <Link to={messagesPath} className={btnClass} title="Messages">
          <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full ${isAdmin ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"} px-1 text-[9px] font-bold ring-2 ring-card shadow-sm`}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* Profile Avatar */}
        <Link
          to={profilePath}
          className="ml-1.5 group"
          title="Profile"
        >
          <Avatar className="h-9 w-9 ring-2 ring-border/30 group-hover:ring-primary/40 transition-all duration-200 group-hover:shadow-md group-active:scale-95">
            <AvatarImage src={avatarUrl || defaultAvatar} alt="Profile" className="object-cover" />
            <AvatarFallback className={`bg-gradient-to-br ${isAdmin ? "from-destructive to-destructive/60" : "from-primary via-primary/80 to-secondary"} text-primary-foreground text-sm font-semibold`}>
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default DashboardHeaderBar;
