import { MarketingShell } from "@/shells/marketing-shell";
import { Hero } from "@/features/marketing/hero";
import { QuickRouteFormInline, QuickRouteFormDrawer } from "@/features/route-planner/quick-route-form";
import HiddenGems from "@/components/hidden-gems";
import PoiSection from "@/components/poi-section";
import FeaturesSection from "@/components/features-section";

export default function LandingPage() {
  const handleRouteSubmit = (startCity: string, endCity: string) => {
    // Handle route submission - could be passed down as prop or context
    console.log('Route submitted:', { startCity, endCity });
  };

  return (
    <MarketingShell navAuthButtons="menu">
      {/* Mobile: Drawer CTA */}
      <div className="lg:hidden">
        <Hero 
          overlay="strong"
          align="center"
          heightClass="min-h-[65vh]"
          cta={
            <QuickRouteFormDrawer 
              onSubmit={handleRouteSubmit}
              triggerText="Start Planning Your Route"
            />
          }
        />
      </div>

      {/* Desktop: Inline Form */}
      <div className="hidden lg:block">
        <Hero 
          overlay="soft"
          align="center"
          heightClass="min-h-[75vh]"
          cta={
            <QuickRouteFormInline 
              onSubmit={handleRouteSubmit}
              density="comfortable"
            />
          }
        />
      </div>

      {/* Rest of the landing page content */}
      <HiddenGems />
      <PoiSection />
      <FeaturesSection />
    </MarketingShell>
  );
}