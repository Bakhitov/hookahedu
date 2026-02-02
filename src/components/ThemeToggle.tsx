import { useTheme } from "next-themes";

import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2 rounded-full  px-3 py-1">
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label={t("common.theme")}
      />
      <span className="text-xs text-muted-foreground">{isDark ? t("common.dark") : t("common.light")}</span>
    </div>
  );
}
