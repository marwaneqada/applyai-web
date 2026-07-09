import { AnalyticsSection } from "@/components/landing/analytics-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { NarrativeBridgeSection } from "@/components/landing/narrative-bridge-section";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { ResultsSection } from "@/components/landing/results-section";
import { StorytellingSection } from "@/components/landing/storytelling-section";
import { TrustSection } from "@/components/landing/trust-section";
import { PublicHeader } from "@/components/layout/public-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fbfaf4] text-[#062b1f]">
      <PublicHeader />
      <main>
        <HeroSection />
        <TrustSection />
        <NarrativeBridgeSection />
        <StorytellingSection />
        <FeaturesSection />
        <ProductPreviewSection />
        <AnalyticsSection />
        <ResultsSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
