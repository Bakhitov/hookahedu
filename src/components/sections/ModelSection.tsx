import { Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const ModelSection = () => {
  const { t, get } = useLanguage();
  const features = get("model.features") as string[];
  const note = get("model.note") as string | undefined;

  return (
    <section id="model" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-4">
              {t("model.label")}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t("model.title")}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t("model.description")}
            </p>

            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            {note ? <p className="text-muted-foreground text-sm mt-6">{note}</p> : null}
          </div>

          <div className="relative">
            <div className="relative aspect-square overflow-hidden m-10 rounded-lg border border-border/50">
              <img src="/working.jpg" alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <h3 className="font-serif text-2xl md:text-3xl font-semibold text-white drop-shadow">
                  {t("model.badgeTitle")}
                </h3>
                <p className="mt-2 text-sm md:text-base text-white/80">
                  {t("model.badgeSubtitle")}
                </p>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border border-primary/20 rounded-lg" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-primary/20 rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModelSection;
