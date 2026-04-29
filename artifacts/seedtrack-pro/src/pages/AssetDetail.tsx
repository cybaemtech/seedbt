import { useState } from "react";
import {
  useGetAsset, useUpdateAsset, useDeleteAsset,
  getListAssetsQueryKey, getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, Edit2, Trash2, Leaf, FlaskConical,
  MapPin, Calendar, Tag, Package, DollarSign,
  User2, BarChart2, TrendingDown, ShieldAlert, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SEED_CATEGORIES = ["Vegetable", "Grain", "Legume", "Oilseed", "Fiber", "Spice", "Fruit", "Herb", "Other"] as const;

const updateSchema = z.object({
  seedName: z.string().min(1, "Required"),
  batchNumber: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(0),
  location: z.string().min(1, "Required"),
  expiryDate: z.string().min(1, "Required"),
  productionDate: z.string().optional(),
  supplier: z.string().optional(),
  category: z.enum(SEED_CATEGORIES).optional(),
  germinationRate: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  pricePerUnit: z.coerce.number().min(0).optional().or(z.literal("")),
});
type UpdateForm = z.infer<typeof updateSchema>;

function StatusBadge({ status, daysRemaining }: { status: string; daysRemaining: number }) {
  if (status === "Expired") return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-1.5 text-[13px] font-bold text-destructive">
      🔴 Expired
    </span>
  );
  if (status === "Expiring") return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 text-[13px] font-bold text-amber-700 dark:text-amber-400">
      🟡 Expiring in {daysRemaining}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
      🟢 Fresh • {daysRemaining}d remaining
    </span>
  );
}

function StockForecast({ quantity, status, daysRemaining }: { quantity: number; status: string; daysRemaining: number }) {
  const weeklyTurnover = 20;
  const weeksLeft = Math.floor(quantity / weeklyTurnover);
  const stockRunDate = new Date();
  stockRunDate.setDate(stockRunDate.getDate() + weeksLeft * 7);
  const expiryFirst = status !== "Fresh" && daysRemaining < weeksLeft * 7;

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Stock Forecast</h3>
            <p className="text-[12px] text-muted-foreground">Based on ~{weeklyTurnover} units/week typical turnover</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Stock Duration</p>
            <p className="text-2xl font-bold">{weeksLeft}<span className="text-base font-medium text-muted-foreground ml-1">wks</span></p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Stockout Date</p>
            <p className="text-[15px] font-bold">{format(stockRunDate, "MMM d, yyyy")}</p>
          </div>
          <div className={`border rounded-xl p-4 ${expiryFirst ? "bg-amber-500/10 border-amber-500/30" : "bg-card border-border/50"}`}>
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Risk Flag</p>
            <div className="flex items-center gap-2">
              {expiryFirst ? (
                <>
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-[13px] font-bold text-amber-700 dark:text-amber-400">Expiry first</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-[13px] font-bold text-emerald-700">Stockout first</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssetDetail() {
  const [, params] = useRoute("/inventory/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const id = params?.id ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: asset, isLoading } = useGetAsset(id);
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const form = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    values: asset ? {
      seedName: asset.seedName,
      batchNumber: asset.batchNumber,
      quantity: asset.quantity,
      location: asset.location,
      expiryDate: asset.expiryDate.split("T")[0],
      productionDate: (asset as any).productionDate ? (asset as any).productionDate.split("T")[0] : "",
      supplier: (asset as any).supplier ?? "",
      category: (asset as any).category ?? undefined,
      germinationRate: (asset as any).germinationRate ?? "",
      pricePerUnit: (asset as any).pricePerUnit ?? "",
    } : undefined,
  });

  const onSubmit = (data: UpdateForm) => {
    const payload: Record<string, unknown> = {
      seedName: data.seedName,
      batchNumber: data.batchNumber,
      quantity: data.quantity,
      location: data.location,
      expiryDate: new Date(data.expiryDate).toISOString(),
    };
    if (data.productionDate) payload.productionDate = new Date(data.productionDate).toISOString();
    if (data.supplier) payload.supplier = data.supplier;
    if (data.category) payload.category = data.category;
    if (data.germinationRate !== "" && data.germinationRate != null) payload.germinationRate = Number(data.germinationRate);
    if (data.pricePerUnit !== "" && data.pricePerUnit != null) payload.pricePerUnit = Number(data.pricePerUnit);

    updateAsset.mutate({ id, data: payload as any }, {
      onSuccess: () => {
        toast.success("Batch updated");
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsEditing(false);
      },
      onError: () => toast.error("Failed to update"),
    });
  };

  const onDelete = () => {
    deleteAsset.mutate({ id }, {
      onSuccess: () => {
        toast.success("Batch deleted");
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
        setLocation("/inventory");
      },
      onError: () => toast.error("Failed to delete"),
    });
  };

  if (isLoading || !asset) {
    return (
      <div className="p-8 md:p-10 space-y-8 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />)}
        </div>
        <div className="h-40 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  const daysRemaining = differenceInDays(new Date(asset.expiryDate), new Date());
  const totalValue = asset.quantity * ((asset as any).pricePerUnit ?? 0);

  const detailFields = [
    { icon: Leaf, label: "Seed Name", value: asset.seedName },
    { icon: Tag, label: "Batch Number", value: <span className="font-mono">{asset.batchNumber}</span> },
    { icon: Package, label: "Category", value: (asset as any).category ?? "—" },
    { icon: User2, label: "Supplier", value: (asset as any).supplier ?? "—" },
    { icon: MapPin, label: "Location", value: asset.location },
    { icon: Calendar, label: "Production Date", value: (asset as any).productionDate ? format(new Date((asset as any).productionDate), "MMM d, yyyy") : "—" },
    { icon: Calendar, label: "Expiry Date", value: format(new Date(asset.expiryDate), "MMM d, yyyy") },
    { icon: FlaskConical, label: "Germination Rate", value: (asset as any).germinationRate != null ? `${(asset as any).germinationRate}%` : "—" },
    { icon: DollarSign, label: "Price Per Unit", value: (asset as any).pricePerUnit != null ? `$${(asset as any).pricePerUnit.toFixed(2)}` : "—" },
    {
      icon: DollarSign, label: "Total Batch Value",
      value: totalValue > 0 ? <span className="font-bold text-primary">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> : "—",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-8 md:p-10 max-w-5xl mx-auto space-y-8 pb-16"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-5">
        <div>
          <Link href="/inventory" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center mb-5 group px-3 py-1.5 -ml-3 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{asset.seedName}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="font-mono text-sm bg-muted/70 px-3 py-1 rounded-lg border border-border/50 font-bold text-muted-foreground">{asset.batchNumber}</span>
            <StatusBadge status={asset.status} daysRemaining={daysRemaining} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="h-10 px-4 rounded-xl font-semibold gap-2 border-border/60 text-sm">
            <Edit2 className="h-4 w-4" /> {isEditing ? "Cancel Edit" : "Edit"}
          </Button>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="h-10 px-4 rounded-xl font-semibold gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 text-sm">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Quantity", value: asset.quantity.toLocaleString(), sub: "units in stock" },
          { label: "Days Remaining", value: daysRemaining < 0 ? "Expired" : daysRemaining.toString(), sub: "until expiry" },
          {
            label: "Batch Value",
            value: totalValue > 0 ? `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—",
            sub: "total estimated",
          },
          {
            label: "Germination",
            value: (asset as any).germinationRate != null ? `${(asset as any).germinationRate}%` : "—",
            sub: "viability rate",
          },
        ].map((kpi, i) => (
          <Card key={i} className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold tracking-tight mt-1.5">{kpi.value}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stock Forecast */}
      <StockForecast quantity={asset.quantity} status={asset.status} daysRemaining={daysRemaining} />

      {/* Detail / Edit */}
      {isEditing ? (
        <Card className="rounded-2xl border-border/60 shadow-md">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold tracking-tight mb-6">Edit Batch</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: "seedName" as const, label: "Seed Name", type: "text" },
                    { name: "batchNumber" as const, label: "Batch Number", type: "text" },
                    { name: "supplier" as const, label: "Supplier", type: "text" },
                    { name: "quantity" as const, label: "Quantity", type: "number" },
                    { name: "location" as const, label: "Location", type: "text" },
                    { name: "productionDate" as const, label: "Production Date", type: "date" },
                    { name: "expiryDate" as const, label: "Expiry Date", type: "date" },
                    { name: "germinationRate" as const, label: "Germination Rate (%)", type: "number" },
                    { name: "pricePerUnit" as const, label: "Price Per Unit ($)", type: "number" },
                  ].map(({ name, label, type }) => (
                    <FormField key={name} control={form.control} name={name} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-semibold text-foreground/80">{label}</FormLabel>
                        <FormControl>
                          <Input type={type} className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}/>
                  ))}
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-foreground/80">Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/50">
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {SEED_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[12px]" />
                    </FormItem>
                  )}/>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="h-11 px-8 rounded-xl font-semibold shadow-md" disabled={updateAsset.isPending}>
                    {updateAsset.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-11 px-6 rounded-xl font-semibold border-border/60">
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-border/60 shadow-md">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold tracking-tight mb-6">Batch Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
              {detailFields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4 py-4 border-b border-border/40 last:border-0">
                  <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="text-[15px] font-semibold text-foreground mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event History */}
      {(asset.events ?? []).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Event History</h3>
          <Card className="rounded-2xl border-border/60 shadow-md">
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {(asset.events ?? []).map((event: any, i: number) => (
                  <div key={i} className="flex items-center gap-5 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {event.type === "Created" && <Package className="h-4 w-4 text-primary" />}
                      {event.type === "Stored" && <MapPin className="h-4 w-4 text-blue-500" />}
                      {event.type === "Dispatched" && <TrendingDown className="h-4 w-4 text-amber-500" />}
                      {event.type === "Delivered" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold">{event.type} <span className="font-normal text-muted-foreground">at</span> {event.location}</p>
                      {event.notes && <p className="text-[12px] text-muted-foreground mt-0.5">{event.notes}</p>}
                    </div>
                    <span className="text-[13px] text-muted-foreground font-medium shrink-0">
                      {format(new Date(event.timestamp), "MMM d, h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-border/60 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Batch</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px]">
              Permanently delete <strong>{asset.seedName}</strong> ({asset.batchNumber})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-xl h-10 px-5 font-semibold mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl h-10 px-5 font-semibold">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
