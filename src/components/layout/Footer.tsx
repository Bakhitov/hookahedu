import { useLanguage } from "@/lib/i18n";
import BrandLockup from "@/components/BrandLockup";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-12 bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <a href="/">
              <BrandLockup />
            </a>
            <p className="text-muted-foreground text-sm mt-2">
              {t("footer.description")}
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/#about" className="hover:text-foreground transition-colors">
              {t("nav.about")}
            </a>
            <a href="/#programs" className="hover:text-foreground transition-colors">
              {t("nav.programs")}
            </a>
            <a href="/#contact" className="hover:text-foreground transition-colors">
              {t("nav.contact")}
            </a>
            <a href="/offer" className="hover:text-foreground transition-colors">
              {t("footer.offer")}
            </a>
            <a href="/policy" className="hover:text-foreground transition-colors">
              {t("footer.policy")}
            </a>
            <a href="/faq" className="hover:text-foreground transition-colors">
              {t("footer.faq")}
            </a>
            <a href="/contacts" className="hover:text-foreground transition-colors">
              {t("nav.contact")}
            </a>
          </div>

          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
