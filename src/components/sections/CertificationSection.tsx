import { Card, CardContent } from "@/components/ui/card";
import { Award, Hash, Calendar, Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const CertificationSection = () => {
  const { t, get } = useLanguage();
  const features = get("certification.features") as Array<{ title: string; description: string }>;
  const icons = [Award, Hash, Calendar, Search];

  return (
    <section id="certification" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Certificate Preview */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="relative overflow-hidden rounded-xl border border-primary/20 shadow-xl">
                <img src="/cert.png" alt="Certificate template" className="w-full object-cover" />
                <div className="absolute inset-0 flex h-full flex-col p-6 sm:p-8 md:p-10 text-neutral-900">
                  <div className="text-center">
                    <p className="text-base sm:text-lg md:text-xl uppercase tracking-[0.4em] text-neutral-700 font-semibold">
                      {t("certification.preview.label")}
                    </p>
                  </div>

                  <div className="mt-6 flex-1 text-center flex flex-col items-center justify-center">
                    <p className="font-serif text-2xl sm:text-3xl md:text-4xl">
                      {t("certification.preview.recipientName")}
                    </p>
                    <p className="mt-4 max-w-[320px] text-xs text-neutral-600 leading-snug">
                      {t("certification.preview.reasonLabel")}
                    </p>
                    <p className="mt-4 text-xs sm:text-sm text-neutral-500">
                      {t("certification.preview.qualificationLabel")}
                    </p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {t("certification.preview.qualificationValue")}
                    </p>
                  </div>

                  <div className="grid gap-4 mx-5 text-xs sm:text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-neutral-500">{t("certification.preview.establishmentLabel")}</p>
                      <p className="font-medium text-neutral-800">
                        {t("certification.preview.establishmentValue")}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-neutral-500">{t("certification.preview.dateLabel")}</p>
                      <p className="font-medium text-neutral-800">{t("certification.preview.dateValue")}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end text-xs sm:text-sm text-neutral-700">
                    <span className="font-semibold">№ {t("certification.preview.number")}</span>
                  </div>
                </div>
              </div>

              {/* Decorative corner */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary/10 -z-10" />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t("certification.title")}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t("certification.description")}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = icons[index];

                return (
                  <Card key={index} className="bg-card/50 border-border/50">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        {Icon ? <Icon className="w-5 h-5 text-accent" /> : null}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm mb-1">{feature.title}</h4>
                        <p className="text-muted-foreground text-xs">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CertificationSection;
