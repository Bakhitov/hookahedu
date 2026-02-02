import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, HelpCircle, Phone } from "lucide-react";
import { apiSend } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

const ContactSection = () => {
  const { t, get } = useLanguage();
  const cards = get("contact.cards") as Array<{ title: string; description: string; action: string }>;
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    establishment: "",
    message: "",
  });
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiSend("/requests", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || null,
          phone: form.phone || null,
          city: form.city || null,
          establishmentName: form.establishment || null,
          message: form.message || null,
        }),
      }),
    onSuccess: () => {
      setSuccess(true);
      setForm({ fullName: "", email: "", phone: "", city: "", establishment: "", message: "" });
    },
  });

  return (
    <section id="contact" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium tracking-widest uppercase text-sm mb-4">
            {t("contact.label")}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t("contact.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("contact.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="bg-background border-border/50 hover:border-primary/30 transition-all group">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                <MessageSquare className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-medium text-foreground mb-2">{cards?.[0]?.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {cards?.[0]?.description}
              </p>
              <Button className="w-full" asChild>
                <a href="/#request">{cards?.[0]?.action}</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-background border-border/50 hover:border-primary/30 transition-all group">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                <HelpCircle className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-medium text-foreground mb-2">{cards?.[1]?.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {cards?.[1]?.description}
              </p>
              <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10" asChild>
                <a href="/faq">{cards?.[1]?.action}</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-background border-border/50 hover:border-primary/30 transition-all group">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                <Phone className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-medium text-foreground mb-2">{cards?.[2]?.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {cards?.[2]?.description}
              </p>
              <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10" asChild>
                <a href="/contacts">{cards?.[2]?.action}</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card id="request" className="bg-background border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">{t("contact.form.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("contact.form.description")}</p>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSuccess(false);
                  mutation.mutate();
                }}
              >
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("contact.form.fullName")}</Label>
                  <Input
                    value={form.fullName}
                    onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("contact.form.email")}</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("contact.form.phone")}</Label>
                  <Input
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("contact.form.city")}</Label>
                  <Input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("contact.form.establishment")}</Label>
                  <Input
                    value={form.establishment}
                    onChange={(event) => setForm((prev) => ({ ...prev, establishment: event.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("contact.form.message")}</Label>
                  <Textarea
                    value={form.message}
                    onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <Button type="submit" disabled={mutation.isPending}>
                    {t("contact.form.submit")}
                  </Button>
                  {success ? <span className="text-sm text-emerald-400">{t("contact.form.success")}</span> : null}
                </div>
                {mutation.isError ? (
                  <p className="text-sm text-destructive md:col-span-2">{(mutation.error as Error).message}</p>
                ) : null}
              </form>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30 border-primary/20">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">{t("contact.note")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
