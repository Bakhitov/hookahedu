import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, FileCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const AboutSection = () => {
  const { t, get } = useLanguage();
  const cards = get("about.cards") as Array<{ title: string; description: string }>;

  return (
    <section id="about" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium tracking-widest uppercase text-sm mb-4">
            {t("about.label")}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t("about.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("about.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-secondary/50 border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                {cards?.[0]?.title}
              </h3>
              <p className="text-muted-foreground">
                {cards?.[0]?.description}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/50 border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                {cards?.[1]?.title}
              </h3>
              <p className="text-muted-foreground">
                {cards?.[1]?.description}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/50 border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <FileCheck className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                {cards?.[2]?.title}
              </h3>
              <p className="text-muted-foreground">
                {cards?.[2]?.description}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
