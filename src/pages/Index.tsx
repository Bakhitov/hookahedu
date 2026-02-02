import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import ModelSection from "@/components/sections/ModelSection";
import AudienceSection from "@/components/sections/AudienceSection";
import ProgramSection from "@/components/sections/ProgramSection";
import ProcessSection from "@/components/sections/ProcessSection";
import CertificationSection from "@/components/sections/CertificationSection";
import RegistrySection from "@/components/sections/RegistrySection";
import RegistrationSection from "@/components/sections/RegistrationSection";
import ContactSection from "@/components/sections/ContactSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <ModelSection />
        <AudienceSection />
        <ProgramSection />
        <ProcessSection />
        <CertificationSection />
        <RegistrySection />
        <RegistrationSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
