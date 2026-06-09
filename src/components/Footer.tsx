import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo.jpeg";

const Footer = () => {
  const [logo, setLogo] = useState(defaultLogo);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    supabase
      .from("theme_settings")
      .select("setting_value")
      .eq("setting_key", "logo_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) setLogo(data.setting_value);
      });

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  }, [deferredPrompt]);
  const footerLinks = {
    forCustomers: [
      { label: "Find Cleaners", href: "/search" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Browse Services", href: "/services" },
      { label: "Reviews", href: "/reviews" },
      { label: "FAQ", href: "/faq" },
    ],
    forCleaners: [
      { label: "Join Our Network", href: "/for-cleaners" },
      { label: "Cleaner Dashboard", href: "/cleaner/dashboard" },
      { label: "Browse Jobs", href: "/jobs" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact Support", href: "/contact" },
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Reviews", href: "/reviews" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-[#0f172a] text-slate-200 dark:bg-[#0b0f19] dark:text-slate-300 dark:border-t dark:border-border/20">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <img src={logo} alt="The Cleaning Network" className="h-14 w-auto mb-4 rounded-lg" />
            <p className="text-primary-foreground/70 mb-6 max-w-xs">
              Canada's trusted marketplace for professional cleaning services. Find, compare, and book verified cleaners.
            </p>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <Mail className="h-4 w-4" />
                <span>hello@thecleaningnetwork.ca</span>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <Phone className="h-4 w-4" />
                <span>1-800-CLEAN-NET</span>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <MapPin className="h-4 w-4" />
                <span>Toronto, Canada</span>
              </div>
            </div>
          </div>

          {/* For Customers */}
          <div>
            <h4 className="font-heading font-semibold mb-4">For Customers</h4>
            <ul className="space-y-3">
              {footerLinks.forCustomers.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Cleaners */}
          <div>
            <h4 className="font-heading font-semibold mb-4">For Cleaners</h4>
            <ul className="space-y-3">
              {footerLinks.forCleaners.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {!isInstalled && (
                <li>
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    <Smartphone className="h-4 w-4" />
                    Install Mobile App
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              © 2026 The Cleaning Network. All rights reserved.
            </p>
            
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
