import { useLanguage } from "@/lib/i18n";

const ProcessSection = () => {
  const { t, get } = useLanguage();
  const steps = get("process.steps") as Array<{ number: string; title: string; description: string }>;

  return (
    <section id="process" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium tracking-widest uppercase text-sm mb-4">
            {t("process.label")}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t("process.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("process.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="group relative bg-background p-6 border border-border/50 hover:border-primary/30 transition-all"
            >
              <span className="font-serif text-5xl font-bold text-primary/20 group-hover:text-primary/30 transition-colors">
                {step.number}
              </span>
              <h3 className="font-semibold text-foreground text-lg mt-2 mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {step.description}
              </p>
              
              {/* Connection line for non-last items */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border/50" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
