import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomepageHero from "@/components/homepage/HomepageHero";
import SearchFilterBar from "@/components/homepage/SearchFilterBar";
import CleanerOfTheWeekCard from "@/components/homepage/CleanerOfTheWeekCard";
import CategoryChipsRow from "@/components/homepage/CategoryChipsRow";

// Lazy-load below-the-fold sections
const SponsoredSpotlightSection = lazy(() => import("@/components/homepage/SponsoredSpotlightSection"));
const HomepageServicesGrid = lazy(() => import("@/components/homepage/HomepageServicesGrid"));
const QuoteRequestSidebar = lazy(() => import("@/components/homepage/QuoteRequestSidebar"));
const MapPreviewCard = lazy(() => import("@/components/homepage/MapPreviewCard"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HomepageHero />

        {/* Full gradient wash area */}
        <div className="bg-gradient-to-b from-muted/60 via-muted/40 to-background">
          <SearchFilterBar />

          {/* Main 2-Column Layout */}
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
              {/* Left Column */}
              <div className="space-y-4 sm:space-y-6">
                <CleanerOfTheWeekCard />
                <CategoryChipsRow />
                <Suspense fallback={<div className="h-48 rounded-xl bg-muted/30 animate-pulse" />}>
                  <SponsoredSpotlightSection />
                </Suspense>
                <Suspense fallback={<div className="h-64 rounded-xl bg-muted/30 animate-pulse" />}>
                  <HomepageServicesGrid />
                </Suspense>
              </div>

              {/* Right Sidebar - stacks below on mobile */}
              <div className="space-y-4 sm:space-y-6">
                <Suspense fallback={<div className="h-64 rounded-xl bg-muted/30 animate-pulse" />}>
                  <QuoteRequestSidebar />
                </Suspense>
                <Suspense fallback={<div className="h-48 rounded-xl bg-muted/30 animate-pulse" />}>
                  <MapPreviewCard />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
