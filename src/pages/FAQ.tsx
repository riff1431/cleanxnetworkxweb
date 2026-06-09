import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How does The Cleaning Network work?", a: "Simply search for cleaning professionals in your area, compare profiles and reviews, and book the one that fits your needs. It's fast, transparent, and secure." },
  { q: "Are the cleaners verified?", a: "Yes! Every cleaning professional on our platform goes through a verification process including identity checks and review monitoring to ensure quality and safety." },
  { q: "How do I pay for a cleaning service?", a: "We support multiple payment methods including bank transfer and wallet payments. Payment details are shared securely through our platform." },
  { q: "Can I cancel or reschedule a booking?", a: "Yes, you can cancel or reschedule through your dashboard. Cancellation policies vary by provider and are displayed at the time of booking." },
  { q: "How do I become a cleaner on the platform?", a: "Visit our 'For Cleaners' page and sign up. Once verified, you can create your profile, list your services, and start receiving bookings." },
  { q: "Is there a subscription fee?", a: "We offer both free and premium subscription plans for cleaners. Customers can browse and book for free. Check our pricing for more details." },
  { q: "What areas do you serve?", a: "We currently serve major cities across Canada, with new areas being added regularly. Search your location to see available cleaners near you." },
  { q: "How do reviews work?", a: "After a completed booking, customers can leave a rating and review for their cleaner. Reviews are verified and help maintain quality across the platform." },
];

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-heading font-bold text-foreground mb-2">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground mb-10">Find answers to common questions about The Cleaning Network.</p>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4">
              <AccordionTrigger className="text-left font-medium text-foreground">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </main>
    <Footer />
  </div>
);

export default FAQ;
