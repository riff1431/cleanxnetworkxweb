import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-heading font-bold text-foreground mb-6">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 25, 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using The Cleaning Network, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Our Services</h2>
            <p>The Cleaning Network is a marketplace that connects customers with independent cleaning professionals. We do not directly provide cleaning services but facilitate connections between customers and service providers.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
            <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account and all activities that occur under it.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Bookings & Payments</h2>
            <p>All bookings are subject to availability and confirmation by the cleaning professional. Prices are set by individual cleaners. Cancellation policies vary by provider and are displayed at the time of booking.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. User Conduct</h2>
            <p>Users agree not to misuse the platform, provide false information, harass other users, or engage in any fraudulent activity. Violation may result in account suspension or termination.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
            <p>The Cleaning Network is not liable for any damages arising from the use of our platform or services provided by cleaning professionals listed on our marketplace.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p>For questions about these Terms, contact us at hello@thecleaningnetwork.ca.</p>
          </section>
        </div>
      </motion.div>
    </main>
    <Footer />
  </div>
);

export default Terms;
