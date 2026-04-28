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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const assetSchema = z.object({
  seedName: z.string().min(1, "Seed name is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  location: z.string().min(1, "Location is required"),
  expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
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
    },
  });

  function onSubmit(data: AssetFormValues) {
    createAsset.mutate(
      {
        data: {
          ...data,
          expiryDate: new Date(data.expiryDate).toISOString(),
        }
      },
      {
        onSuccess: (asset) => {
          queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast.success("Asset created successfully");
          setLocation(`/inventory/${asset.id}`);
        },
        onError: () => {
          toast.error("Failed to create asset");
        },
      }
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
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Inventory
        </Link>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Add New Asset</h1>
        <p className="text-base text-muted-foreground mt-2">Register a new seed batch into the inventory system.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative">
          
          <div className="space-y-8 bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Batch Identity</h3>
              <p className="text-[14px] text-muted-foreground mt-1.5">Primary details for this seed batch.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="seedName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-foreground/80">Seed Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hybrid Chilli KS-401" className="h-11 rounded-xl bg-muted/40 border-border/50 focus-visible:ring-primary/30" {...field} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-foreground/80">Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BATCH-2023-01" className="h-11 rounded-xl bg-muted/40 border-border/50 focus-visible:ring-primary/30 font-mono font-medium" {...field} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-8 bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Status & Location</h3>
              <p className="text-[14px] text-muted-foreground mt-1.5">Initial quantity, storage, and validity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-foreground/80">Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" className="h-11 rounded-xl bg-muted/40 border-border/50 focus-visible:ring-primary/30" {...field} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-foreground/80">Initial Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Warehouse A, Aisle 3" className="h-11 rounded-xl bg-muted/40 border-border/50 focus-visible:ring-primary/30" {...field} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-[13px] font-semibold text-foreground/80">Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 rounded-xl bg-muted/40 border-border/50 focus-visible:ring-primary/30" {...field} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="fixed bottom-0 right-0 left-0 md:left-[260px] p-5 bg-background/80 backdrop-blur-xl border-t border-border/60 flex justify-end gap-4 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            <Link href="/inventory">
              <Button variant="outline" type="button" className="h-11 px-6 rounded-xl font-semibold shadow-sm border-border/60">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createAsset.isPending} className="h-11 px-8 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
              {createAsset.isPending ? "Creating..." : "Create Asset"}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
