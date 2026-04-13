import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import SampleAnalysis from "@/components/landing/SampleAnalysis";
import NigerianFoods from "@/components/landing/NigerianFoods";
import TrustSection from "@/components/landing/TrustSection";
import FinalCTA from "@/components/landing/FinalCTA";
import { Leaf } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <SampleAnalysis />
      <NigerianFoods />
      <TrustSection />
      <FinalCTA />

      
    </div>
  );
};

export default Index;
