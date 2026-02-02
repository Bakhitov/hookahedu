import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, type Language } from "@/lib/translations";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  get: (key: string) => any;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getValue(source: Record<string, any>, path: string) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), source);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("appLanguage") as Language | null;
    return stored || "ru";
  });

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => {
    return (key: string) => {
      const current = getValue(translations[language], key);
      if (typeof current === "string") {
        return current;
      }
      const fallback = getValue(translations.ru, key);
      if (typeof fallback === "string") {
        return fallback;
      }
      return key;
    };
  }, [language]);

  const get = useMemo(() => {
    return (key: string) => {
      const current = getValue(translations[language], key);
      if (current !== undefined) {
        return current;
      }
      return getValue(translations.ru, key);
    };
  }, [language]);

  const setLanguage = (value: Language) => {
    setLanguageState(value);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, get }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
