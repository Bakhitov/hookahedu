import { Button } from "@/components/ui/button";
import { Award, Shield, Star } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Spotlight } from "@/components/ui/spotlight";
import BrandLockup from "@/components/BrandLockup";

const HeroSection = () => {
  const { t, get } = useLanguage();
  const features = get("hero.features") as string[];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <Spotlight />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/35 to-background dark:from-background/5 dark:via-background/25" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <BrandLockup
            className="inline-flex flex-col items-center mb-6"
            topClassName="text-2xl md:text-3xl font-black tracking-tight text-primary"
            bottomClassName="text-xs md:text-sm font-normal tracking-[0.2em] uppercase text-primary/80"
          />
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            {t("hero.title")}
            <span className="block text-primary">{t("hero.titleAccent")}</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
            {t("hero.subtitle")}
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-foreground/80">
              <Award className="w-5 h-5 text-accent" />
              <span>{features?.[0]}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <Shield className="w-5 h-5 text-accent" />
              <span>{features?.[1]}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <Star className="w-5 h-5 text-accent" />
              <span>{features?.[2]}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/#request">{t("common.cta")}</a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 border-primary/30 text-foreground hover:bg-primary/10"
              asChild
            >
              <a href="/#about">{t("common.learnMore")}</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex justify-center pt-2">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
