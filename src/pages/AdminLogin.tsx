import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { apiSend } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import BrandLockup from "@/components/BrandLockup";

export default function AdminLogin() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [bootstrap, setBootstrap] = useState({ email: "", password: "", key: "" });
  const [bootstrapAgeConfirmed, setBootstrapAgeConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loginMutation = useMutation({
    mutationFn: () =>
      apiSend("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: (data) => {
      if (data.role !== "admin") {
        const message = t("auth.invalidRole");
        setErrorMessage(message);
        toast.error(message);
        return;
      }
      setAuth(data.role);
      navigate("/admin");
    },
    onError: (error: any) => {
      const message = error.message || t("common.error");
      setErrorMessage(message);
      toast.error(message);
    },
  });

  const bootstrapMutation = useMutation({
    mutationFn: () =>
      apiSend("/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify(bootstrap),
      }),
    onSuccess: (data) => {
      setAuth(data.role);
      navigate("/admin");
    },
    onError: (error: any) => {
      const message = error.message || t("common.error");
      setErrorMessage(message);
      toast.error(message);
    },
  });

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto mb-6 flex max-w-4xl justify-end gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="mx-auto mb-8 max-w-4xl text-center">
        <BrandLockup
          className="inline-flex flex-col items-center"
          topClassName="text-3xl md:text-4xl"
          bottomClassName="text-sm md:text-base"
        />
        <p className="mt-2 text-muted-foreground">
          {t("auth.adminPanelSubtitle")}
        </p>
      </div>
      <div className="mx-auto max-w-md">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value);
            setErrorMessage("");
          }}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
            <TabsTrigger value="bootstrap">{t("auth.bootstrapTitle")}</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t("auth.adminTitle")}</CardTitle>
                <CardDescription>{t("auth.adminLoginDescription")}</CardDescription>
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
          </TabsContent>
          <TabsContent value="bootstrap">
            <Card className="border-primary/30 bg-secondary/30">
              <CardHeader>
                <CardTitle>{t("auth.bootstrapTitle")}</CardTitle>
                <CardDescription>{t("auth.bootstrapDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("auth.email")}</Label>
                  <Input
                    type="email"
                    value={bootstrap.email}
                    onChange={(event) => setBootstrap((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("auth.password")}</Label>
                  <Input
                    type="password"
                    value={bootstrap.password}
                    onChange={(event) => setBootstrap((prev) => ({ ...prev, password: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("auth.bootstrapKey")}</Label>
                  <Input
                    value={bootstrap.key}
                    onChange={(event) => setBootstrap((prev) => ({ ...prev, key: event.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={bootstrapAgeConfirmed}
                    onCheckedChange={(value) => setBootstrapAgeConfirmed(Boolean(value))}
                  />
                  <Label className="text-sm">{t("auth.ageConfirm")}</Label>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    if (!bootstrapAgeConfirmed) {
                      toast.error(t("auth.ageConfirm"));
                      return;
                    }
                    bootstrapMutation.mutate();
                  }}
                  disabled={bootstrapMutation.isPending}
                >
                  {t("auth.bootstrapTitle")}
                </Button>
                {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
