import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import PoiSection from "@/components/poi-section";
import FeaturesSection from "@/components/features-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <PoiSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
