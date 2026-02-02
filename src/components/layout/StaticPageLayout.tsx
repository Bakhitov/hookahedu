import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/lib/i18n";

export default function StaticPageLayout({ titleKey, descriptionKey }: { titleKey: string; descriptionKey: string }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card/60 p-8 shadow-sm">
              <h1 className="text-3xl font-semibold text-foreground">{t(titleKey)}</h1>
              <p className="mt-4 text-muted-foreground">{t(descriptionKey)}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
