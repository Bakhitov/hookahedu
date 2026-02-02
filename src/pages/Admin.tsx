import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  CheckCircle2,
  ClipboardCheck,
  FileUp,
  ShieldCheck,
  Users,
  AlertTriangle,
  Pencil,
  Send,
  Archive,
  RotateCcw,
  ArrowLeftRight,
} from "lucide-react";

import { API_BASE, apiGet, apiSend, buildQuery } from "@/lib/api";
import { clearAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { toast } from "@/components/ui/sonner";

function getEmployeeStatusLabels(t: (key: string) => string) {
  return {
    pending_registration: t("admin.employeeStatus.pending_registration"),
    reset_password: t("admin.employeeStatus.reset_password"),
    registered: t("admin.employeeStatus.registered"),
    training_pending: t("admin.employeeStatus.training_pending"),
    training_passed: t("admin.employeeStatus.training_passed"),
    training_failed: t("admin.employeeStatus.training_failed"),
    certified: t("admin.employeeStatus.certified"),
    inactive: t("admin.employeeStatus.inactive"),
  };
}

function getCertificateStatusLabels(t: (key: string) => string) {
  return {
    active: t("admin.certificateStatus.active"),
    revoked: t("admin.certificateStatus.revoked"),
    expired: t("admin.certificateStatus.expired"),
  };
}

const statusClassMap: Record<string, string> = {
  pending_registration: "bg-muted text-muted-foreground",
  reset_password: "bg-amber-500/10 text-amber-300",
  registered: "bg-sky-500/10 text-sky-300",
  training_pending: "bg-amber-500/10 text-amber-300",
  training_passed: "bg-emerald-500/10 text-emerald-300",
  training_failed: "bg-rose-500/10 text-rose-300",
  certified: "bg-emerald-500/20 text-emerald-200",
  inactive: "bg-zinc-500/10 text-zinc-300",
  active: "bg-emerald-500/10 text-emerald-300",
  revoked: "bg-rose-500/10 text-rose-300",
  expired: "bg-amber-500/10 text-amber-300",
};

function StatusBadge({ value, label }: { value: string; label: string }) {
  return <Badge className={statusClassMap[value] || "bg-muted text-muted-foreground"}>{label}</Badge>;
}

function formatKzPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  let rest = digits;
  if (rest.startsWith("7") || rest.startsWith("8")) {
    rest = rest.slice(1);
  }
  rest = rest.slice(0, 10);
  const parts = [];
  if (rest.length > 0) parts.push(rest.slice(0, 3));
  if (rest.length > 3) parts.push(rest.slice(3, 6));
  if (rest.length > 6) parts.push(rest.slice(6, 8));
  if (rest.length > 8) parts.push(rest.slice(8, 10));
  return `+7 ${parts.join(" ")}`.trim();
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function MetricsPanel() {
  const { t } = useLanguage();
  const employeeStatusLabels = getEmployeeStatusLabels(t);
  const { data, isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: () => apiGet("/metrics"),
  });

  const statusEntries = useMemo(() => {
    if (!data?.employeeStatuses) return [];
    return data.employeeStatuses.map((entry: { status: string; count: number }) => ({
      label: employeeStatusLabels[entry.status] || entry.status,
      status: entry.status,
      count: entry.count,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("admin.metrics.title")}
        description={t("admin.metrics.description")}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-gradient-to-br from-card via-card to-muted/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">{t("admin.metrics.establishments")}</CardTitle>
            <Building2 className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{isLoading ? "..." : data?.establishments || 0}</CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-card via-card to-muted/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">{t("admin.metrics.employees")}</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{isLoading ? "..." : data?.employees || 0}</CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-card via-card to-muted/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">{t("admin.metrics.activeCertificates")}</CardTitle>
            <ShieldCheck className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{isLoading ? "..." : data?.activeCertificates || 0}</CardContent>
        </Card>
      </div>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("admin.metrics.statuses")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {statusEntries.map((entry) => (
              <div key={entry.status} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <StatusBadge value={entry.status} label={entry.label} />
                <span className="text-sm text-muted-foreground">{entry.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EstablishmentsPanel() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<any | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    city: "",
    representative: "",
    representativePhone: "",
    address: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    city: "",
    representative: "",
    representativePhone: "",
    address: "",
  });

  useEffect(() => {
    if (!editTarget) return;
    setEditForm({
      name: editTarget.name || "",
      city: editTarget.city || "",
      representative: editTarget.representative || "",
      representativePhone: formatKzPhone(editTarget.representative_phone || ""),
      address: editTarget.address || "",
    });
  }, [editTarget]);

  const { data, isLoading } = useQuery({
    queryKey: ["establishments", { includeArchived: showArchived }],
    queryFn: () =>
      apiGet(
        `/establishments${buildQuery({
          includeArchived: showArchived ? "true" : undefined,
        })}`
      ),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiSend("/establishments", {
        method: "POST",
        body: JSON.stringify(createForm),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
      setCreateForm({ name: "", city: "", representative: "", representativePhone: "", address: "" });
      setCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiSend(`/establishments/${editTarget?.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
      setEditTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiSend(`/establishments/${archiveTarget?.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
      setArchiveTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => apiSend(`/establishments/${restoreTarget?.id}/restore`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
      setRestoreTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionHeader
          title={t("admin.establishments.title")}
          description={t("admin.establishments.description")}
        />
        <Button onClick={() => setCreateOpen(true)}>{t("admin.establishments.add")}</Button>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-medium">{t("admin.establishments.listTitle")}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Label htmlFor="establishments-archived-toggle" className="text-xs">
              {t("admin.filters.showArchived")}
            </Label>
            <Switch
              id="establishments-archived-toggle"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.establishments.table.name")}</TableHead>
                <TableHead>{t("admin.establishments.table.city")}</TableHead>
                <TableHead>{t("admin.establishments.table.address")}</TableHead>
                <TableHead>{t("admin.establishments.table.representative")}</TableHead>
                <TableHead>{t("admin.establishments.table.employees")}</TableHead>
                <TableHead>{t("admin.establishments.table.certificates")}</TableHead>
                <TableHead className="text-right">{t("admin.establishments.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>{t("common.loading")}</TableCell>
                </TableRow>
              ) : (
                data?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.deleted_at ? (
                          <Badge className="bg-muted text-muted-foreground">{t("common.archived")}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{item.city}</TableCell>
                    <TableCell>{item.address || "-"}</TableCell>
                    <TableCell>{item.representative || "-"}</TableCell>
                    <TableCell>{item.employees_count}</TableCell>
                    <TableCell>{item.certificates_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        {item.deleted_at ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("common.restore")}
                            title={t("common.restore")}
                            onClick={() => setRestoreTarget(item)}
                          >
                            <RotateCcw />
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("common.edit")}
                              title={t("common.edit")}
                              onClick={() => {
                                setEditTarget(item);
                              }}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("common.archive")}
                              title={t("common.archive")}
                              onClick={() => setArchiveTarget(item)}
                            >
                              <Archive />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.establishments.newTitle")}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="est-create-name">{t("admin.establishments.fields.name")}</Label>
              <Input
                id="est-create-name"
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={t("admin.establishments.placeholders.name")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-create-city">{t("admin.establishments.fields.city")}</Label>
              <Input
                id="est-create-city"
                value={createForm.city}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, city: event.target.value }))}
                placeholder={t("admin.establishments.placeholders.city")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-create-rep">{t("admin.establishments.fields.representative")}</Label>
              <Input
                id="est-create-rep"
                value={createForm.representative}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, representative: event.target.value }))}
                placeholder={t("admin.establishments.placeholders.representativeName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-create-phone">{t("admin.establishments.fields.representativePhone")}</Label>
              <Input
                id="est-create-phone"
                inputMode="tel"
                value={createForm.representativePhone}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, representativePhone: formatKzPhone(event.target.value) }))
                }
                placeholder={t("admin.establishments.placeholders.representativePhone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-create-address">{t("admin.establishments.fields.address")}</Label>
              <Input
                id="est-create-address"
                value={createForm.address}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder={t("admin.establishments.placeholders.address")}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {t("admin.establishments.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editTarget)} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.establishments.editTitle")}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="est-edit-name">{t("admin.establishments.fields.name")}</Label>
              <Input
                id="est-edit-name"
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-edit-city">{t("admin.establishments.fields.city")}</Label>
              <Input
                id="est-edit-city"
                value={editForm.city}
                onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-edit-rep">{t("admin.establishments.fields.representative")}</Label>
              <Input
                id="est-edit-rep"
                value={editForm.representative}
                onChange={(event) => setEditForm((prev) => ({ ...prev, representative: event.target.value }))}
                placeholder={t("admin.establishments.placeholders.representativeName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-edit-phone">{t("admin.establishments.fields.representativePhone")}</Label>
              <Input
                id="est-edit-phone"
                inputMode="tel"
                value={editForm.representativePhone}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, representativePhone: formatKzPhone(event.target.value) }))
                }
                placeholder={t("admin.establishments.placeholders.representativePhone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-edit-address">{t("admin.establishments.fields.address")}</Label>
              <Input
                id="est-edit-address"
                value={editForm.address}
                onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder={t("admin.establishments.placeholders.address")}
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setEditTarget(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(archiveTarget)} onOpenChange={() => setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.establishments.archiveTitle")}</DialogTitle>
            <DialogDescription>{t("admin.establishments.archiveDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setArchiveTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
              {t("common.archive")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(restoreTarget)} onOpenChange={() => setRestoreTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.establishments.restoreTitle")}</DialogTitle>
            <DialogDescription>{t("admin.establishments.restoreDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRestoreTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
              {t("common.restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmployeesPanel() {
  const { t } = useLanguage();
  const employeeStatusLabels = getEmployeeStatusLabels(t);
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<any | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null);
  const [transferTarget, setTransferTarget] = useState<any | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState({ establishmentId: "all", status: "all", search: "" });
  const [transferForm, setTransferForm] = useState({ establishmentId: "", reason: "" });
  const [createForm, setCreateForm] = useState({ establishmentId: "", fullName: "", email: "", city: "", phone: "" });
  const [editForm, setEditForm] = useState({ fullName: "", city: "", phone: "", status: "registered" });

  useEffect(() => {
    if (!editTarget) return;
    setEditForm({
      fullName: editTarget.full_name || "",
      city: editTarget.city || "",
      phone: formatKzPhone(editTarget.phone || ""),
      status: editTarget.status || "registered",
    });
  }, [editTarget]);

  useEffect(() => {
    if (!transferTarget) return;
    setTransferForm({ establishmentId: "", reason: "" });
  }, [transferTarget]);

  const { data: establishments } = useQuery({
    queryKey: ["establishments"],
    queryFn: () => apiGet("/establishments"),
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", filters, showArchived],
    queryFn: () =>
      apiGet(
        `/employees${buildQuery({
          establishmentId: filters.establishmentId === "all" ? undefined : filters.establishmentId,
          status: filters.status === "all" ? undefined : filters.status,
          search: filters.search || undefined,
          includeArchived: showArchived ? "true" : undefined,
        })}`
      ),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiSend("/employees", {
        method: "POST",
        body: JSON.stringify(createForm),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setCreateForm({ establishmentId: "", fullName: "", email: "", city: "", phone: "" });
      setCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiSend(`/employees/${editTarget?.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiSend(`/employees/${archiveTarget?.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setArchiveTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () =>
      apiSend(`/employees/${restoreTarget?.id}/restore`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setRestoreTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      apiSend(`/employees/${transferTarget?.id}/transfer`, {
        method: "POST",
        body: JSON.stringify(transferForm),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setTransferTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const trainingMutation = useMutation({
    mutationFn: (employeeId: string) => apiSend(`/employees/${employeeId}/send-training`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionHeader
          title={t("admin.employees.title")}
          description={t("admin.employees.description")}
        />
        <Button onClick={() => setCreateOpen(true)}>{t("admin.employees.createTitle")}</Button>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-medium">{t("admin.employees.listTitle")}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.establishmentId}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, establishmentId: value }))}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder={t("admin.employees.fields.establishment")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {establishments?.map((item: any) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder={t("admin.employees.table.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {Object.entries(employeeStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="h-8 w-[200px]"
              placeholder={t("admin.employees.search")}
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters({ establishmentId: "all", status: "all", search: "" })}
            >
              {t("admin.employees.actions.reset")}
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Label htmlFor="employees-archived-toggle" className="text-xs">
                {t("admin.filters.showArchived")}
              </Label>
              <Switch
                id="employees-archived-toggle"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.employees.table.name")}</TableHead>
                <TableHead>{t("admin.employees.table.email")}</TableHead>
                <TableHead>{t("admin.employees.table.establishment")}</TableHead>
                <TableHead>{t("admin.employees.table.status")}</TableHead>
                <TableHead>{t("admin.employees.table.registration")}</TableHead>
                <TableHead>{t("admin.employees.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>{t("common.loading")}</TableCell>
                </TableRow>
              ) : (
                employees?.map((employee: any) => {
                  const registrationLink = employee.registration_token
                    ? `${window.location.origin}/register/${employee.registration_token}`
                    : null;
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{employee.full_name}</span>
                          {employee.deleted_at ? (
                            <Badge className="bg-muted text-muted-foreground">{t("common.archived")}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{employee.establishment_name}</span>
                          {employee.establishment_address ? (
                            <span className="text-xs text-muted-foreground">{employee.establishment_address}</span>
                          ) : null}
                          {employee.establishment_deleted_at ? (
                            <span className="text-xs text-muted-foreground">{t("admin.employees.establishmentArchived")}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={employee.status} label={employeeStatusLabels[employee.status] || employee.status} />
                      </TableCell>
                      <TableCell className="text-xs">
                        {registrationLink ? (
                          <a
                            className="block max-w-[160px] truncate text-primary hover:underline md:max-w-[220px]"
                            href={registrationLink}
                            title={registrationLink}
                          >
                            {registrationLink}
                          </a>
                        ) : (
                          t("admin.employees.table.completed")
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("admin.employees.actions.sendTraining")}
                            title={t("admin.employees.actions.sendTraining")}
                            disabled={trainingMutation.isPending || employee.deleted_at}
                            onClick={() => trainingMutation.mutate(employee.id)}
                          >
                            <Send />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("admin.employees.actions.transfer")}
                            title={t("admin.employees.actions.transfer")}
                            onClick={() => setTransferTarget(employee)}
                          >
                            <ArrowLeftRight />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("common.edit")}
                            title={t("common.edit")}
                            disabled={employee.deleted_at}
                            onClick={() => {
                              setEditTarget(employee);
                            }}
                          >
                            <Pencil />
                          </Button>
                          {employee.deleted_at ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("common.restore")}
                              title={t("common.restore")}
                              onClick={() => setRestoreTarget(employee)}
                            >
                              <RotateCcw />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("common.archive")}
                              title={t("common.archive")}
                              onClick={() => setArchiveTarget(employee)}
                            >
                              <Archive />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.employees.createTitle")}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>{t("admin.employees.fields.establishment")}</Label>
              <Select
                value={createForm.establishmentId || undefined}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, establishmentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.employees.fields.establishment")} />
                </SelectTrigger>
                <SelectContent>
                  {establishments?.map((item: any) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        {item.address ? (
                          <span className="text-xs text-muted-foreground">{item.address}</span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.employees.fields.fullName")}</Label>
              <Input
                value={createForm.fullName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.employees.fields.email")}</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("admin.employees.fields.city")}</Label>
                <Input
                  value={createForm.city}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, city: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.employees.fields.phone")}</Label>
                <Input
                  value={createForm.phone}
                  inputMode="tel"
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: formatKzPhone(event.target.value) }))}
                  placeholder={t("admin.employees.placeholders.phone")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || !createForm.establishmentId}>
                {t("admin.employees.actions.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editTarget)} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.employees.editTitle")}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>{t("admin.employees.fields.fullName")}</Label>
              <Input
                value={editForm.fullName}
                onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("admin.employees.fields.city")}</Label>
                <Input value={editForm.city} onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.employees.fields.phone")}</Label>
                <Input
                  value={editForm.phone}
                  inputMode="tel"
                  onChange={(event) => setEditForm((prev) => ({ ...prev, phone: formatKzPhone(event.target.value) }))}
                  placeholder={t("admin.employees.placeholders.phone")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.employees.table.status")}</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.employees.table.status")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(employeeStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setEditTarget(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(archiveTarget)} onOpenChange={() => setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.employees.archiveTitle")}</DialogTitle>
            <DialogDescription>{t("admin.employees.archiveDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setArchiveTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
              {t("common.archive")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(restoreTarget)} onOpenChange={() => setRestoreTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.employees.restoreTitle")}</DialogTitle>
            <DialogDescription>{t("admin.employees.restoreDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRestoreTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
              {t("common.restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(transferTarget)} onOpenChange={() => setTransferTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.employees.transferTitle")}</DialogTitle>
            <DialogDescription>{t("admin.employees.transferDescription")}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              transferMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>{t("admin.employees.fields.establishment")}</Label>
              <Select
                value={transferForm.establishmentId || undefined}
                onValueChange={(value) => setTransferForm((prev) => ({ ...prev, establishmentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.employees.fields.establishment")} />
                </SelectTrigger>
                <SelectContent>
                  {establishments?.map((item: any) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        {item.address ? (
                          <span className="text-xs text-muted-foreground">{item.address}</span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.employees.fields.reason")}</Label>
              <Textarea
                value={transferForm.reason}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, reason: event.target.value }))}
                placeholder={t("admin.employees.placeholders.reason")}
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setTransferTarget(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={transferMutation.isPending || !transferForm.establishmentId}>
                {t("admin.employees.actions.transfer")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CertificatesPanel() {
  const { t, language } = useLanguage();
  const certificateStatusLabels = getCertificateStatusLabels(t);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ establishmentId: "all", status: "all", search: "" });
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ employeeId: "", validUntil: "" });
  const [revokeReason, setRevokeReason] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);

  const openCertificatePdf = (certificateId: string) => {
    const url = `${API_BASE}/certificates/${certificateId}/pdf`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const { data: establishments } = useQuery({
    queryKey: ["establishments"],
    queryFn: () => apiGet("/establishments"),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees", { status: "registered" }],
    queryFn: () => apiGet(`/employees${buildQuery({ status: "registered" })}`),
  });

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["certificates", filters],
    queryFn: () =>
      apiGet(
        `/certificates${buildQuery({
          establishmentId: filters.establishmentId === "all" ? undefined : filters.establishmentId,
          status: filters.status === "all" ? undefined : filters.status,
          search: filters.search || undefined,
        })}`
      ),
  });

  const issueMutation = useMutation({
    mutationFn: () =>
      apiSend("/certificates", {
        method: "POST",
        body: JSON.stringify({
          employeeId: issueForm.employeeId,
          validUntil: issueForm.validUntil || undefined,
        }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setIssueForm({ employeeId: "", validUntil: "" });
      setIssueOpen(false);
      if (data?.id) {
        openCertificatePdf(data.id);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () =>
      apiSend(`/certificates/${selectedCertificate?.id}/revoke`, {
        method: "POST",
        body: JSON.stringify({ reason: revokeReason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setSelectedCertificate(null);
      setRevokeReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || t("common.error"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionHeader
          title={t("admin.certificates.title")}
          description={t("admin.certificates.description")}
        />
        <Button onClick={() => setIssueOpen(true)}>{t("admin.certificates.actions.issue")}</Button>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-medium">{t("admin.certificates.listTitle")}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.establishmentId}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, establishmentId: value }))}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder={t("admin.certificates.fields.establishment")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {establishments?.map((item: any) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder={t("admin.certificates.fields.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {Object.entries(certificateStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="h-8 w-[200px]"
              placeholder={t("admin.employees.search")}
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters({ establishmentId: "all", status: "all", search: "" })}
            >
              {t("admin.certificates.actions.reset")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.certificates.table.number")}</TableHead>
                <TableHead>{t("admin.certificates.table.employee")}</TableHead>
                <TableHead>{t("admin.certificates.table.establishment")}</TableHead>
                <TableHead>{t("admin.certificates.table.status")}</TableHead>
                <TableHead>{t("admin.certificates.table.validUntil")}</TableHead>
                <TableHead>{t("admin.certificates.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>{t("common.loading")}</TableCell>
                </TableRow>
              ) : (
                certificates?.map((certificate: any) => (
                  <TableRow key={certificate.id}>
                    <TableCell className="font-medium">{certificate.certificate_number}</TableCell>
                    <TableCell>
                      {certificate.full_name}
                      <div className="text-xs text-muted-foreground">{certificate.email}</div>
                    </TableCell>
                    <TableCell>{certificate.establishment_name}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={certificate.status}
                        label={certificateStatusLabels[certificate.status] || certificate.status}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(certificate.valid_until).toLocaleDateString(
                        language === "en" ? "en-US" : language === "kk" ? "kk-KZ" : "ru-RU",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openCertificatePdf(certificate.id)}>
                          {t("admin.certificates.actions.download")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={certificate.status !== "active"}
                          onClick={() => setSelectedCertificate(certificate)}
                        >
                          {t("admin.certificates.actions.revoke")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.certificates.issueTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.certificates.fields.employee")}</Label>
              <Select
                value={issueForm.employeeId || undefined}
                onValueChange={(value) => setIssueForm((prev) => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.certificates.fields.employee")} />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} — {employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.certificates.fields.validUntil")}</Label>
              <Input
                type="date"
                value={issueForm.validUntil}
                onChange={(event) => setIssueForm((prev) => ({ ...prev, validUntil: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => issueMutation.mutate()}
              disabled={!issueForm.employeeId || issueMutation.isPending}
            >
              {t("admin.certificates.actions.issue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(selectedCertificate)} onOpenChange={() => setSelectedCertificate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.certificates.revokeDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("admin.certificates.revokeDialog.reason")}</Label>
            <Textarea value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedCertificate(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" disabled={!revokeReason} onClick={() => revokeMutation.mutate()}>
              {t("admin.certificates.actions.revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImportPanel() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<any>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error(t("admin.import.fileMissing"));
      const data = new FormData();
      data.append("file", file);
      return apiSend("/training/import", { method: "POST", body: data });
    },
    onSuccess: (data) => setReport(data),
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("admin.import.title")}
        description={t("admin.import.description")}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("admin.import.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <Button disabled={mutation.isPending || !file} onClick={() => mutation.mutate()}>
            {t("admin.import.action")}
          </Button>
          {mutation.isError ? <p className="text-sm text-destructive">{(mutation.error as Error).message}</p> : null}
        </CardContent>
      </Card>
      {report ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">{t("admin.import.reportTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <span>{t("admin.import.processed")}</span>
                <span className="font-semibold">{report.processed}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <span>{t("admin.import.matched")}</span>
                <span className="font-semibold">{report.matched}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <span>{t("admin.import.certificatesCreated")}</span>
                <span className="font-semibold">{report.certificatesCreated}</span>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border/60 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {t("admin.import.unmatched")}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {report.unmatched?.length ? (
                    report.unmatched.map((entry: any, index: number) => (
                      <div key={`${entry.email}-${index}`}>{entry.email}</div>
                    ))
                  ) : (
                    <div>{t("common.none")}</div>
                  )}
                </div>
              </div>
              <div className="rounded-md border border-border/60 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  {t("admin.import.errors")}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {report.errors?.length ? (
                    report.errors.map((entry: any, index: number) => (
                      <div key={`${entry.error}-${index}`}>{entry.error}</div>
                    ))
                  ) : (
                    <div>{t("common.none")}</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function AuditPanel() {
  const { t, language } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => apiGet("/audit-logs"),
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("admin.audit.title")}
        description={t("admin.audit.description")}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("admin.audit.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.audit.table.time")}</TableHead>
                <TableHead>{t("admin.audit.table.actor")}</TableHead>
                <TableHead>{t("admin.audit.table.action")}</TableHead>
                <TableHead>{t("admin.audit.table.entity")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>{t("common.loading")}</TableCell>
                </TableRow>
              ) : (
                data?.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleString(
                        language === "en" ? "en-US" : language === "kk" ? "kk-KZ" : "ru-RU",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </TableCell>
                    <TableCell>{entry.actor || "system"}</TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>
                      {entry.entity_type}
                      {entry.entity_id ? ` · ${entry.entity_id.slice(0, 6)}` : ""}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RequestsPanel() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const statusLabels = {
    new: t("admin.requests.status.new"),
    in_progress: t("admin.requests.status.in_progress"),
    closed: t("admin.requests.status.closed"),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["requests", statusFilter],
    queryFn: () =>
      apiGet(
        `/requests${buildQuery({
          status: statusFilter === "all" ? undefined : statusFilter,
        })}`
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiSend(`/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requests"] }),
  });

  return (
    <div className="space-y-6">
      <SectionHeader title={t("admin.requests.title")} description={t("admin.requests.description")} />
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-medium">{t("admin.requests.title")}</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("common.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="new">{statusLabels.new}</SelectItem>
              <SelectItem value="in_progress">{statusLabels.in_progress}</SelectItem>
              <SelectItem value="closed">{statusLabels.closed}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.requests.table.name")}</TableHead>
                <TableHead>{t("admin.requests.table.contact")}</TableHead>
                <TableHead>{t("admin.requests.table.city")}</TableHead>
                <TableHead>{t("admin.requests.table.establishment")}</TableHead>
                <TableHead>{t("admin.requests.table.message")}</TableHead>
                <TableHead>{t("admin.requests.table.status")}</TableHead>
                <TableHead>{t("admin.requests.table.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>{t("common.loading")}</TableCell>
                </TableRow>
              ) : (
                data?.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {request.email || request.phone || t("common.notAvailable")}
                    </TableCell>
                    <TableCell>{request.city || "-"}</TableCell>
                    <TableCell>{request.establishment_name || "-"}</TableCell>
                    <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                      {request.message || "-"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={request.status}
                        onValueChange={(value) => updateMutation.mutate({ id: request.id, status: value })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">{statusLabels.new}</SelectItem>
                          <SelectItem value="in_progress">{statusLabels.in_progress}</SelectItem>
                          <SelectItem value="closed">{statusLabels.closed}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString(
                        language === "en" ? "en-US" : language === "kk" ? "kk-KZ" : "ru-RU",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminHeader() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/me"),
  });

  return (
    <div className="border-b border-border/60 bg-gradient-to-r from-background via-card/70 to-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin.header.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("admin.header.label")}</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <LanguageToggle />
          <ThemeToggle />
          <div className="rounded-md border border-border/60 px-3 py-2 text-sm text-muted-foreground">
            {data?.user?.email || data?.email || "admin"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              apiSend("/auth/logout", { method: "POST" })
                .catch(() => undefined)
                .finally(() => {
                  clearAuth();
                  navigate("/admin/login");
                });
            }}
          >
            {t("common.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="flex h-auto w-full flex-wrap gap-2 md:grid md:grid-cols-7">
            <TabsTrigger value="dashboard" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              {t("admin.tabs.dashboard")}
            </TabsTrigger>
            <TabsTrigger value="establishments" className="gap-2">
              <Building2 className="h-4 w-4" />
              {t("admin.tabs.establishments")}
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              {t("admin.tabs.employees")}
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t("admin.tabs.certificates")}
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <FileUp className="h-4 w-4" />
              {t("admin.tabs.import")}
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              {t("admin.tabs.requests")}
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              {t("admin.tabs.audit")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <MetricsPanel />
          </TabsContent>
          <TabsContent value="establishments">
            <EstablishmentsPanel />
          </TabsContent>
          <TabsContent value="employees">
            <EmployeesPanel />
          </TabsContent>
          <TabsContent value="certificates">
            <CertificatesPanel />
          </TabsContent>
          <TabsContent value="import">
            <ImportPanel />
          </TabsContent>
          <TabsContent value="requests">
            <RequestsPanel />
          </TabsContent>
          <TabsContent value="audit">
            <AuditPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
