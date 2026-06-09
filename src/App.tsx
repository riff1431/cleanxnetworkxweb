import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import GlobalFontProvider from "@/components/GlobalFontProvider";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import UpdateBanner from "@/components/UpdateBanner";
import OfflineBanner from "@/components/OfflineBanner";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";

// Only the homepage is eagerly loaded for fastest initial paint
import Index from "./pages/Index";

// All other pages are lazy-loaded for code splitting
const Search = lazy(() => import("./pages/Search"));
const CleanerPublicProfile = lazy(() => import("./pages/CleanerProfile"));
const Auth = lazy(() => import("./pages/Auth"));
const ForCleaners = lazy(() => import("./pages/ForCleaners"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const FindServices = lazy(() => import("./pages/FindServices"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BookingConfirmation = lazy(() => import("./pages/dashboard/BookingConfirmation"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Customer Dashboard
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const DashboardOverview = lazy(() => import("./pages/dashboard/DashboardOverview"));
const UpcomingBookings = lazy(() => import("./pages/dashboard/UpcomingBookings"));
const BookingHistory = lazy(() => import("./pages/dashboard/BookingHistory"));
const Addresses = lazy(() => import("./pages/dashboard/Addresses"));
const Profile = lazy(() => import("./pages/dashboard/Profile"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const Subscription = lazy(() => import("./pages/dashboard/Subscription"));
const MyJobs = lazy(() => import("./pages/dashboard/MyJobs"));
const BookingDetail = lazy(() => import("./pages/dashboard/BookingDetail"));
const MyQuotes = lazy(() => import("./pages/dashboard/MyQuotes"));
const CustomerMessages = lazy(() => import("./pages/dashboard/Messages"));
const CustomerInvoices = lazy(() => import("./pages/dashboard/Invoices"));
const CustomerWallet = lazy(() => import("./pages/dashboard/Wallet"));

// Cleaner Dashboard
const CleanerDashboardLayout = lazy(() => import("./components/cleaner-dashboard/CleanerDashboardLayout"));
const CleanerDashboardOverview = lazy(() => import("./pages/cleaner-dashboard/CleanerDashboardOverview"));
const CleanerBookingRequests = lazy(() => import("./pages/cleaner-dashboard/CleanerBookingRequests"));
const CleanerSchedule = lazy(() => import("./pages/cleaner-dashboard/CleanerSchedule"));
const CleanerProfile = lazy(() => import("./pages/cleaner-dashboard/CleanerProfile"));
const CleanerEarnings = lazy(() => import("./pages/cleaner-dashboard/CleanerEarnings"));
const CleanerSettings = lazy(() => import("./pages/cleaner-dashboard/CleanerSettings"));
const CleanerSubscription = lazy(() => import("./pages/cleaner-dashboard/CleanerSubscription"));
const CleanerSponsorship = lazy(() => import("./pages/cleaner-dashboard/CleanerSponsorship"));
const CleanerServiceListings = lazy(() => import("./pages/cleaner-dashboard/CleanerServiceListings"));
const CleanerQuoteRequests = lazy(() => import("./pages/cleaner-dashboard/CleanerQuoteRequests"));
const CleanerMessages = lazy(() => import("./pages/cleaner-dashboard/CleanerMessages"));
const CleanerInvoices = lazy(() => import("./pages/cleaner-dashboard/CleanerInvoices"));
const CleanerWallet = lazy(() => import("./pages/cleaner-dashboard/CleanerWallet"));
const CleanerVerification = lazy(() => import("./pages/cleaner-dashboard/CleanerVerification"));

// Admin Dashboard
const AdminDashboardLayout = lazy(() => import("./components/admin-dashboard/AdminDashboardLayout"));
const AdminDashboardOverview = lazy(() => import("./pages/admin-dashboard/AdminDashboardOverview"));
const AdminUsers = lazy(() => import("./pages/admin-dashboard/AdminUsers"));
const AdminCleaners = lazy(() => import("./pages/admin-dashboard/AdminCleaners"));
const AdminBookings = lazy(() => import("./pages/admin-dashboard/AdminBookings"));
const AdminPaymentGateway = lazy(() => import("./pages/admin-dashboard/AdminPaymentGateway"));
const AdminPaymentVerification = lazy(() => import("./pages/admin-dashboard/AdminPaymentVerification"));
const AdminSettings = lazy(() => import("./pages/admin-dashboard/AdminSettings"));
const AdminSubscriptionPlans = lazy(() => import("./pages/admin-dashboard/AdminSubscriptionPlans"));
const AdminSubscriptionVerification = lazy(() => import("./pages/admin-dashboard/AdminSubscriptionVerification"));
const AdminSponsoredListings = lazy(() => import("./pages/admin-dashboard/AdminSponsoredListings"));
const AdminCleanerOfTheWeek = lazy(() => import("./pages/admin-dashboard/AdminCleanerOfTheWeek"));
const AdminThemeManagement = lazy(() => import("./pages/admin-dashboard/AdminThemeManagement"));
const AdminServiceListings = lazy(() => import("./pages/admin-dashboard/AdminServiceListings"));
const AdminJobs = lazy(() => import("./pages/admin-dashboard/AdminJobs"));
const AdminQuoteRequests = lazy(() => import("./pages/admin-dashboard/AdminQuoteRequests"));
const AdminMessages = lazy(() => import("./pages/admin-dashboard/AdminMessages"));
const AdminInvoices = lazy(() => import("./pages/admin-dashboard/AdminInvoices"));
const AdminWallets = lazy(() => import("./pages/admin-dashboard/AdminWallets"));
const AdminNotifications = lazy(() => import("./pages/admin-dashboard/AdminNotifications"));
const AdminVerificationDocuments = lazy(() => import("./pages/admin-dashboard/AdminVerificationDocuments"));

const queryClient = new QueryClient();

const AnimatedApp = () => {
  useMessageNotifications();
  usePushSubscription();
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cleaner/:id" element={<CleanerPublicProfile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/for-cleaners" element={<ForCleaners />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/services" element={<FindServices />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          
          {/* Customer Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="upcoming" element={<UpcomingBookings />} />
            <Route path="history" element={<BookingHistory />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="my-jobs" element={<MyJobs />} />
            <Route path="booking/:id" element={<BookingDetail />} />
            <Route path="quotes" element={<MyQuotes />} />
            <Route path="messages" element={<CustomerMessages />} />
            <Route path="invoices" element={<CustomerInvoices />} />
            <Route path="wallet" element={<CustomerWallet />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Cleaner Dashboard Routes */}
          <Route path="/cleaner" element={<CleanerDashboardLayout />}>
            <Route path="dashboard" element={<CleanerDashboardOverview />} />
            <Route path="bookings" element={<CleanerBookingRequests />} />
            <Route path="schedule" element={<CleanerSchedule />} />
            <Route path="subscription" element={<CleanerSubscription />} />
            <Route path="sponsorship" element={<CleanerSponsorship />} />
            <Route path="profile" element={<CleanerProfile />} />
            <Route path="earnings" element={<CleanerEarnings />} />
            <Route path="settings" element={<CleanerSettings />} />
            <Route path="services" element={<CleanerServiceListings />} />
            <Route path="quotes" element={<CleanerQuoteRequests />} />
            <Route path="messages" element={<CleanerMessages />} />
            <Route path="invoices" element={<CleanerInvoices />} />
            <Route path="wallet" element={<CleanerWallet />} />
            <Route path="verification" element={<CleanerVerification />} />
          </Route>

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminDashboardLayout />}>
            <Route path="dashboard" element={<AdminDashboardOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="cleaners" element={<AdminCleaners />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="subscriptions" element={<AdminSubscriptionPlans />} />
            <Route path="subscription-verification" element={<AdminSubscriptionVerification />} />
            <Route path="sponsored" element={<AdminSponsoredListings />} />
            <Route path="cleaner-of-the-week" element={<AdminCleanerOfTheWeek />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="payment-gateway" element={<AdminPaymentGateway />} />
            <Route path="payment-verification" element={<AdminPaymentVerification />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="theme" element={<AdminThemeManagement />} />
            <Route path="service-listings" element={<AdminServiceListings />} />
            <Route path="quotes" element={<AdminQuoteRequests />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="wallets" element={<AdminWallets />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="verification" element={<AdminVerificationDocuments />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageTransition>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="tcn-theme">
    <AuthProvider>
      <GlobalFontProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UpdateBanner />
          <OfflineBanner />
          <AnimatedApp />
          <BackToTop />
        </BrowserRouter>
      </TooltipProvider>
      </GlobalFontProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
