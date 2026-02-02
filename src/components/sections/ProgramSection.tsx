import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/lib/i18n";

const ProgramSection = () => {
  const { t, get } = useLanguage();
  const programs = get("program.list") as Array<{ title: string; content: string }>;

  return (
    <section id="programs" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium tracking-widest uppercase text-sm mb-4">
            {t("program.label")}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t("program.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("program.description")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {programs.map((program, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border/50 rounded-lg px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-foreground hover:text-primary hover:no-underline py-6">
                  <span className="flex items-center gap-4 text-left">
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{program.title}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 pl-12">
                  {program.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default ProgramSection;
