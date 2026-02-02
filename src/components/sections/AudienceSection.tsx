import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, UserCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const AudienceSection = () => {
  const { t, get } = useLanguage();
  const cards = get("audience.cards") as Array<{
    title: string;
    descriptionPrimary: string;
    descriptionSecondary: string;
    link: string;
  }>;

  return (
    <section id="audience" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium tracking-widest uppercase text-sm mb-4">
            {t("audience.label")}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t("audience.title")}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="bg-background border-border/50 hover:border-primary/50 transition-all hover:shadow-lg group">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Building2 className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="font-serif text-2xl text-foreground">
                {cards?.[0]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {cards?.[0]?.descriptionPrimary}
              </p>
              <p className="text-muted-foreground">
                {cards?.[0]?.descriptionSecondary}
              </p>
              <a href="/#registration" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all">
                {cards?.[0]?.link} <ArrowRight className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>

          <Card className="bg-background border-border/50 hover:border-primary/50 transition-all hover:shadow-lg group">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <UserCircle className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="font-serif text-2xl text-foreground">
                {cards?.[1]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {cards?.[1]?.descriptionPrimary}
              </p>
              <p className="text-muted-foreground">
                {cards?.[1]?.descriptionSecondary}
              </p>
              <a href="/#registration" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all">
                {cards?.[1]?.link} <ArrowRight className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
