import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { apiSend } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import BrandLockup from "@/components/BrandLockup";

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");

  const loginMutation = useMutation({
    mutationFn: () =>
      apiSend("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: (data) => {
      if (data.role !== "employee") {
        const message = t("auth.invalidRole");
        setErrorMessage(message);
        toast.error(message);
        return;
      }
      setAuth(data.role);
      navigate("/account");
    },
    onError: (error: any) => {
      const message = error.message || t("common.error");
      setErrorMessage(message);
      toast.error(message);
    },
  });

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto mb-6 flex max-w-md justify-end gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="mx-auto mb-8 max-w-md text-center">
        <BrandLockup
          className="inline-flex flex-col items-center"
          topClassName="text-3xl md:text-4xl"
          bottomClassName="text-sm md:text-base"
        />
        <p className="mt-2 text-muted-foreground">{t("auth.userPanelSubtitle")}</p>
      </div>
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("auth.userTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auth.password")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={() => loginMutation.mutate()} disabled={loginMutation.isPending}>
              {t("auth.login")}
            </Button>
            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
