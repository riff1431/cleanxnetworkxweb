import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Search, Briefcase, CalendarDays, Star, User, LogOut, LayoutDashboard, Shield, ShoppingBag, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo-new.png";
import defaultAvatar from "@/assets/default-avatar.png";
import { motion, AnimatePresence } from "framer-motion";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logo, setLogo] = useState(defaultLogo);
  const [scrolled, setScrolled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user, signOut, loading, role } = useAuth();
  const unreadCount = useUnreadMessages();
  const { wallet } = useWallet();
  const { currencySymbol } = usePlatformSettings();

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
    supabase
      .from("theme_settings")
      .select("setting_value")
      .eq("setting_key", "logo_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) setLogo(data.setting_value);
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Find Cleaners", href: "/search", icon: Search },
    { label: "Services", href: "/services", icon: ShoppingBag },
    { label: "Post a Job", href: "/jobs", icon: Briefcase },
    { label: "My Bookings", href: "/dashboard/upcoming", icon: CalendarDays },
    { label: "Reviews", href: "/reviews", icon: Star },
  ];

  const getInitials = (email: string) => email.charAt(0).toUpperCase();

  const getUserName = () => {
    if (!user) return "";
    const name = user.user_metadata?.full_name;
    if (name) {
      const parts = name.split(" ");
      return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : parts[0];
    }
    const emailName = user.email?.split("@")[0] || "User";
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "glass-strong shadow-md"
          : "bg-background border-b border-border/40 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-12 items-center justify-between lg:h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <motion.img
              src={logo}
              alt="The Cleaning Network"
              className="h-9 w-auto lg:h-11"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </Link>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Link
                  to={link.href}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-primary hover:text-primary-dark transition-all duration-200 rounded-lg hover:bg-primary/5"
                >
                  <link.icon className="h-3.5 w-3.5 text-secondary group-hover:text-secondary-dark transition-colors" />
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-1.5">
            <ThemeToggle />
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    {role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      to="/dashboard/wallet"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors text-[13px] font-medium text-foreground"
                      title="Wallet"
                    >
                      <Wallet className="h-3.5 w-3.5 text-secondary" />
                      <span>{currencySymbol}{wallet?.balance?.toFixed(2) ?? "0.00"}</span>
                    </Link>
                    <NotificationBell />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors outline-none">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={avatarUrl || defaultAvatar} alt="Profile" />
                            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                              {getInitials(user.email || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[13px] font-medium text-foreground">{getUserName()}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard" className="flex items-center gap-2 text-sm">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            My Dashboard
                          </Link>
                        </DropdownMenuItem>
                        {role === "cleaner" && (
                          <DropdownMenuItem asChild>
                            <Link to="/cleaner/dashboard" className="flex items-center gap-2 text-sm">
                              <Briefcase className="h-3.5 w-3.5" />
                              Cleaner Portal
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/profile" className="flex items-center gap-2 text-sm">
                            <User className="h-3.5 w-3.5" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-sm text-destructive">
                          <LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      to="/auth"
                      className="px-2.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Log in
                    </Link>
                    <span className="text-border mx-0.5">·</span>
                    <Link
                      to="/auth"
                      className="px-2.5 py-1 text-[13px] font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-1.5 text-foreground rounded-md hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden border-t border-border/50"
            >
              <nav className="flex flex-col gap-0.5 py-3">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <link.icon className="h-4 w-4 text-secondary" />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <div className="flex items-center justify-between px-3 pt-3 mt-3 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>

                {!loading && (
                  <div className="flex flex-col gap-2 mt-3 px-3 pt-3 border-t border-border/50">
                    {user ? (
                      <>
                        <div className="flex items-center gap-2.5 px-1 py-1 mb-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl || defaultAvatar} alt="Profile" />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                              {getInitials(user.email || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">{getUserName()}</span>
                        </div>
                        <Link
                          to="/dashboard/wallet"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <Wallet className="h-4 w-4 text-secondary" />
                          Wallet: {currencySymbol}{wallet?.balance?.toFixed(2) ?? "0.00"}
                        </Link>
                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                          <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Dashboard
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                        </Button>
                        <Button variant="secondary" size="sm" className="w-full" asChild>
                          <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
