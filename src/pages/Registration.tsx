import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiGet, apiSend } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/lib/i18n";
import { toast } from "@/components/ui/sonner";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import BrandLockup from "@/components/BrandLockup";

export default function Registration() {
  const { token } = useParams();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    city: "",
    phone: "",
    iin: "",
    password: "",
    confirmPassword: "",
    acceptPolicy: false,
    acceptOffer: false,
    acceptAge: false,
  });
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration", token],
    queryFn: () => apiGet(`/registration/${token}`),
    enabled: Boolean(token),
  });

  const isPasswordReset = data?.status === "reset_password";

  useEffect(() => {
    if (!data) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || data.full_name || "",
      email: prev.email || data.email || "",
      city: prev.city || data.employee_city || data.establishment_city || "",
      phone: prev.phone || data.employee_phone || data.phone || "",
    }));
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      apiSend(`/registration/${token}`, {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          city: form.city,
          phone: form.phone,
          iin: form.iin || null,
          password: form.password,
          acceptPolicy: form.acceptPolicy,
          acceptOffer: form.acceptOffer,
          acceptAge: form.acceptAge,
        }),
      }),
    onSuccess: () => setSuccess(true),
    onError: (error: any) => {
      if (error.message === "USER_EXISTS") {
        toast.error(t("registration.userExists"));
        return;
      }
      toast.error(error.message || t("common.error"));
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background p-8">{t("common.loading")}</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-8">{t("registration.unavailable")}</div>;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto mb-6 flex max-w-xl justify-end gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="mx-auto mb-8 max-w-xl text-center">
          <BrandLockup
            className="inline-flex flex-col items-center"
            topClassName="text-3xl md:text-4xl"
            bottomClassName="text-sm md:text-base"
          />
        </div>
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>{t("registration.successTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("registration.successMessage")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto mb-6 flex max-w-2xl justify-end gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <BrandLockup
          className="inline-flex flex-col items-center"
          topClassName="text-3xl md:text-4xl"
          bottomClassName="text-sm md:text-base"
        />
      </div>
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("registration.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border/60 p-4 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{data?.full_name || t("registration.employeeFallback")}</div>
              <div>{data?.email}</div>
              <div>{data?.establishment_name}</div>
              {data?.establishment_address ? <div>{data.establishment_address}</div> : null}
            </div>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPasswordError(null);
                if (form.password !== form.confirmPassword) {
                  setPasswordError("password_mismatch");
                  toast.error(t("registration.form.passwordMismatch"));
                  return;
                }
                if (!form.acceptPolicy || !form.acceptOffer || !form.acceptAge) {
                  toast.error(t("registration.form.consentsRequired"));
                  return;
                }
                mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label>{t("registration.form.fullName")}</Label>
                <Input
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  disabled={isPasswordReset}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("registration.form.email")}</Label>
                <Input type="email" value={form.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label>{t("registration.form.city")}</Label>
                <Input
                  value={form.city}
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                  disabled={isPasswordReset}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("registration.form.phone")}</Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  disabled={isPasswordReset}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t("registration.form.iin")}</Label>
                <Input
                  value={form.iin}
                  onChange={(event) => setForm((prev) => ({ ...prev, iin: event.target.value }))}
                  disabled={isPasswordReset}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("registration.form.password")}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("registration.form.confirmPassword")}</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  required
                  minLength={8}
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.acceptPolicy}
                    onCheckedChange={(value) => setForm((prev) => ({ ...prev, acceptPolicy: Boolean(value) }))}
                  />
                  <Label className="text-sm">{t("registration.form.policy")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.acceptOffer}
                    onCheckedChange={(value) => setForm((prev) => ({ ...prev, acceptOffer: Boolean(value) }))}
                  />
                  <Label className="text-sm">{t("registration.form.offer")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.acceptAge}
                    onCheckedChange={(value) => setForm((prev) => ({ ...prev, acceptAge: Boolean(value) }))}
                  />
                  <Label className="text-sm">{t("registration.form.ageConfirm")}</Label>
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={mutation.isPending || !form.acceptPolicy || !form.acceptOffer || !form.acceptAge}
                >
                  {t("registration.form.submit")}
                </Button>
              </div>
            </form>
            {passwordError ? (
              <p className="text-sm text-destructive">{t("registration.form.passwordMismatch")}</p>
            ) : null}
            {mutation.isError ? (
              <p className="text-sm text-destructive">
                {(mutation.error as Error).message === "USER_EXISTS"
                  ? t("registration.userExists")
                  : (mutation.error as Error).message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
