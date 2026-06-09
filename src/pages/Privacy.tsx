import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-heading font-bold text-foreground mb-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 25, 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide directly, including your name, email address, phone number, and payment information when you create an account or make a booking. We also automatically collect usage data such as your IP address, browser type, and pages visited.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve our services, process transactions, communicate with you, personalize your experience, and ensure the safety and security of our platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Information Sharing</h2>
            <p>We share your information with cleaning professionals when you make a booking. We do not sell your personal information to third parties. We may share data with service providers who assist us in operating our platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information at any time. You can manage your preferences through your account settings or by contacting us directly.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at hello@thecleaningnetwork.ca.</p>
          </section>
        </div>
      </motion.div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
