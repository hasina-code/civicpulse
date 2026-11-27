import { AboutSection } from "@/client/components/landing/about-section";
import { CallToAction } from "../../client/components/landing/CallToAction";
import { CategoryGrid } from "../../client/components/landing/CategoryGrid";
import { CityRadarPreview } from "../../client/components/landing/CityRadarPreview";
import { ComparisonTable } from "../../client/components/landing/ComparisonTable";
import { ExecutiveInsights } from "../../client/components/landing/ExecutiveInsights";
import { HeroBanner } from "../../client/components/landing/HeroBanner";
import { HowItWorks } from "../../client/components/landing/HowItWorks";

import { RoleEcosystem } from "../../client/components/landing/RoleEcosystem";
import { StatusTimelineDemo } from "../../client/components/landing/StatusTimelineDemo";
import { FeaturesSection } from "@/client/components/landing/features-section";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <AboutSection />
      <CategoryGrid />
      <HowItWorks />
      <CityRadarPreview />
      <FeaturesSection/>
      <RoleEcosystem />
      <StatusTimelineDemo />
      <ExecutiveInsights />
      <ComparisonTable />
      <CallToAction />
    </>
  );
}
