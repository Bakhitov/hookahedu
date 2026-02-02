import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

const RegistrationSection = () => {
  const { t, get } = useLanguage();
  const steps = get("participation.steps") as string[];

  return (
    <section id="registration" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-4">
              {t("participation.label")}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t("participation.title")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("participation.description")}
            </p>
            <p className="text-muted-foreground text-sm mt-6">
              {t("participation.note")}
            </p>
          </div>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("participation.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RegistrationSection;
