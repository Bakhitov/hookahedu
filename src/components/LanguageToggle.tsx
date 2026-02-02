import { useLanguage } from "@/lib/i18n";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <ToggleGroup
      type="single"
      value={language}
      onValueChange={(value) => {
        if (value) setLanguage(value as "ru" | "kk" | "en");
      }}
      aria-label={t("common.language")}
      className="rounded-md border border-border/60"
    >
      <ToggleGroupItem value="ru" size="sm">
        RU
      </ToggleGroupItem>
      <ToggleGroupItem value="kk" size="sm">
        KZ
      </ToggleGroupItem>
      <ToggleGroupItem value="en" size="sm">
        EN
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
