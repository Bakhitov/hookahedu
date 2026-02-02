import { useQuery } from "@tanstack/react-query";

import { apiGet, apiSend } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";

const statusClassMap: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-300",
  revoked: "bg-rose-500/10 text-rose-300",
  expired: "bg-amber-500/10 text-amber-300",
};

export default function Account() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const statusLabels: Record<string, string> = {
    active: t("admin.certificateStatus.active"),
    revoked: t("admin.certificateStatus.revoked"),
    expired: t("admin.certificateStatus.expired"),
  };
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/me"),
  });

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap justify-end gap-3">
          <LanguageToggle />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              apiSend("/auth/logout", { method: "POST" })
                .catch(() => undefined)
                .finally(() => {
                  clearAuth();
                  navigate("/login");
                });
            }}
          >
            {t("common.logout")}
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{t("account.title")}</h1>
          <p className="text-muted-foreground">{t("account.subtitle")}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("account.certificates")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">{t("common.loading")}</p>
            ) : data?.certificates?.length ? (
              data.certificates.map((certificate: any) => (
                <div
                  key={certificate.id}
                  className="flex flex-col gap-2 rounded-md border border-border/60 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm text-muted-foreground">{certificate.certificate_number}</div>
                    <div className="text-sm">
                      {t("account.validUntil")}{" "}
                      {new Date(certificate.valid_until).toLocaleDateString(
                        language === "en" ? "en-US" : language === "kk" ? "kk-KZ" : "ru-RU",
                        { day: "2-digit", month: "2-digit", year: "numeric" }
                      )}
                    </div>
                  </div>
                  <Badge className={statusClassMap[certificate.status] || "bg-muted text-muted-foreground"}>
                    {statusLabels[certificate.status] || certificate.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">{t("account.empty")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
