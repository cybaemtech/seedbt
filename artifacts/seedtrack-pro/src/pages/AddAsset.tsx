import { useCreateAsset, getListAssetsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const SEED_CATEGORIES = ["Vegetable", "Grain", "Legume", "Oilseed", "Fiber", "Spice", "Fruit", "Herb", "Other"] as const;

const assetSchema = z.object({
  seedName: z.string().min(1, "Seed name is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  location: z.string().min(1, "Location is required"),
  expiryDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  productionDate: z.string().optional(),
  supplier: z.string().optional(),
  category: z.enum(SEED_CATEGORIES).optional(),
  germinationRate: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  pricePerUnit: z.coerce.number().min(0).optional().or(z.literal("")),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function AddAsset() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createAsset = useCreateAsset();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      seedName: "",
      batchNumber: "",
      quantity: 0,
      location: "",
      expiryDate: new Date().toISOString().split("T")[0],
      productionDate: "",
      supplier: "",
      category: undefined,
      germinationRate: "",
      pricePerUnit: "",
    },
  });

  function onSubmit(data: AssetFormValues) {
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

    createAsset.mutate(
      { data: payload as any },
      {
        onSuccess: (asset) => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast.success("Batch registered successfully");
          setLocation(`/inventory/${asset.id}`);
        },
        onError: () => toast.error("Failed to create asset"),
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-8 md:p-10 max-w-3xl mx-auto space-y-8 pb-32"
    >
      <div>
        <Link href="/inventory" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center mb-6 transition-colors group px-3 py-1.5 -ml-3 rounded-lg hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Seed Inventory
        </Link>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Register Batch</h1>
        <p className="text-base text-muted-foreground mt-2">Register a new seed batch into the inventory system.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Batch Identity */}
          <div className="space-y-6 bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Batch Identity</h3>
              <p className="text-[14px] text-muted-foreground mt-1.5">Primary identification details.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="seedName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Seed Name *</FormLabel>
                  <FormControl><Input placeholder="e.g. Hybrid Chilli KS-401" className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
              <FormField control={form.control} name="batchNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Batch Number *</FormLabel>
                  <FormControl><Input placeholder="e.g. CHL-2026-A12" className="h-11 rounded-xl bg-muted/40 border-border/50 font-mono" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Supplier</FormLabel>
                  <FormControl><Input placeholder="e.g. Kaveri Seeds Ltd" className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
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
          </div>

          {/* Status & Location */}
          <div className="space-y-6 bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Status & Location</h3>
              <p className="text-[14px] text-muted-foreground mt-1.5">Quantity, storage, and validity dates.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Quantity *</FormLabel>
                  <FormControl><Input type="number" placeholder="0" className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Initial Location *</FormLabel>
                  <FormControl><Input placeholder="e.g. Warehouse A" className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
              <FormField control={form.control} name="productionDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Production Date</FormLabel>
                  <FormControl><Input type="date" className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Expiry Date *</FormLabel>
                  <FormControl><Input type="date" className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
            </div>
          </div>

          {/* Quality & Pricing */}
          <div className="space-y-6 bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Quality & Pricing</h3>
              <p className="text-[14px] text-muted-foreground mt-1.5">Germination rate and unit pricing for value tracking.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="germinationRate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Germination Rate (%)</FormLabel>
                  <FormControl><Input type="number" min={0} max={100} placeholder="e.g. 92" className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
              <FormField control={form.control} name="pricePerUnit" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-foreground/80">Price Per Unit ($)</FormLabel>
                  <FormControl><Input type="number" min={0} step={0.01} placeholder="e.g. 18.50" className="h-11 rounded-xl bg-muted/40 border-border/50" {...field} /></FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}/>
            </div>
          </div>

          <div className="fixed bottom-0 right-0 left-0 md:left-[260px] p-5 bg-background/80 backdrop-blur-xl border-t border-border/60 flex justify-end gap-4 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <Link href="/inventory">
              <Button variant="outline" type="button" className="h-11 px-6 rounded-xl font-semibold border-border/60">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createAsset.isPending} className="h-11 px-8 rounded-xl font-semibold shadow-md hover:shadow-lg">
              {createAsset.isPending ? "Registering..." : "Register Batch"}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
