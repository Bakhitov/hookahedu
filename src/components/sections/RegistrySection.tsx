import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const RegistrySection = () => {
  const { t, get } = useLanguage();
  const accessList = get("registry.accessList") as string[];
  const benefitsList = get("registry.benefitsList") as string[];

  return (
    <section id="registry" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-4">
              {t("registry.label")}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t("registry.title")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("registry.description")}
            </p>
            <p className="text-muted-foreground text-sm mt-6">
              {t("registry.note")}
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="bg-background border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("registry.accessTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {accessList.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1 h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-accent" />
                      </span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("registry.benefitsTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {benefitsList.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1 h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-accent" />
                      </span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrySection;
