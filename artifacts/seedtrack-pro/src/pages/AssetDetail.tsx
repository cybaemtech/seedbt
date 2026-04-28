import { useRoute } from "wouter";
import { 
  useGetAsset, 
  getGetAssetQueryKey, 
  useUpdateAsset, 
  useDeleteAsset,
  useListAssetHistory,
  useCreateAssetHistory,
  getListAssetsQueryKey,
  getListAssetHistoryQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Package, 
  Activity,
  PlusCircle,
  Truck,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  Save,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const movementSchema = z.object({
  type: z.enum(["Created", "Stored", "Dispatched", "Delivered"]),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AssetDetail() {
  const [, params] = useRoute("/inventory/:id");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("edit") === "true") {
      setIsEditing(true);
    }
  }, []);

  const { data: asset, isLoading: isAssetLoading } = useGetAsset(id as string, { 
    query: { enabled: !!id, queryKey: getGetAssetQueryKey(id as string) } 
  });
  
  const { data: history, isLoading: isHistoryLoading } = useListAssetHistory(id as string, {
    query: { enabled: !!id, queryKey: getListAssetHistoryQueryKey(id as string) }
  });

  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const createHistory = useCreateAssetHistory();

  const movementForm = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: "Stored",
      location: "",
      notes: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(z.object({
      seedName: z.string().min(1),
      batchNumber: z.string().min(1),
      quantity: z.coerce.number().min(0),
      location: z.string().min(1),
      expiryDate: z.string()
    })),
    values: asset ? {
      seedName: asset.seedName,
      batchNumber: asset.batchNumber,
      quantity: asset.quantity,
      location: asset.location,
      expiryDate: new Date(asset.expiryDate).toISOString().split('T')[0]
    } : undefined
  });

  if (isAssetLoading || !asset) {
    return (
      <div className="p-8 md:p-10 max-w-6xl mx-auto space-y-8">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-2xl" />
            <div className="h-72 bg-muted animate-pulse rounded-2xl" />
          </div>
          <div className="lg:col-span-2">
            <div className="h-96 bg-muted animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteAsset.mutate({ id: asset.id }, {
      onSuccess: () => {
        toast.success("Asset deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation("/inventory");
      },
      onError: () => toast.error("Failed to delete asset")
    });
  };

  const onEditSubmit = (data: any) => {
    updateAsset.mutate({
      id: asset.id,
      data: {
        ...data,
        expiryDate: new Date(data.expiryDate).toISOString()
      }
    }, {
      onSuccess: () => {
        toast.success("Asset updated successfully");
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetAssetQueryKey(asset.id) });
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      },
      onError: () => toast.error("Failed to update asset")
    });
  };

  const onMovementSubmit = (data: MovementFormValues) => {
    createHistory.mutate({
      id: asset.id,
      data
    }, {
      onSuccess: () => {
        toast.success("Movement event logged successfully");
        movementForm.reset({ type: "Stored", location: "", notes: "" });
        queryClient.invalidateQueries({ queryKey: getListAssetHistoryQueryKey(asset.id) });
        
        if (data.location !== asset.location) {
           queryClient.invalidateQueries({ queryKey: getGetAssetQueryKey(asset.id) });
        }
      },
      onError: () => toast.error("Failed to log event")
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Fresh":
        return (
          <div className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-primary">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
            Fresh
          </div>
        );
      case "Expiring":
        return (
          <div className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-amber-600">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Expiring
          </div>
        );
      case "Expired":
        return (
          <div className="inline-flex items-center rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-destructive">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-destructive"></span>
            Expired
          </div>
        );
      default:
        return null;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "Created": return <PlusCircle className="h-4 w-4 text-primary" />;
      case "Stored": return <Package className="h-4 w-4 text-blue-500" />;
      case "Dispatched": return <Truck className="h-4 w-4 text-orange-500" />;
      case "Delivered": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="p-8 md:p-10 max-w-6xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants}>
        <Link href="/inventory" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center mb-6 transition-colors group px-3 py-1.5 -ml-3 rounded-lg hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Inventory
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{asset.seedName}</h1>
              {getStatusBadge(asset.status)}
            </div>
            <p className="text-muted-foreground font-mono mt-1 text-[15px] font-medium">{asset.batchNumber}</p>
          </div>
          <div className="flex gap-3">
            <Button variant={isEditing ? "default" : "outline"} className={`h-10 px-5 rounded-xl font-semibold shadow-sm transition-all ${isEditing ? "bg-muted text-foreground hover:bg-muted/80 border-border/50" : "bg-card border-border/60 hover:bg-muted/50"}`} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
              {isEditing ? "Cancel Edit" : "Edit Asset"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-10 px-5 rounded-xl font-semibold text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive shadow-sm transition-all">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-border/60 shadow-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Delete Asset</AlertDialogTitle>
                  <AlertDialogDescription className="text-[15px]">
                    This will permanently delete <strong>{asset.seedName}</strong> and its history. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 gap-3">
                  <AlertDialogCancel className="rounded-xl h-10 px-5 font-semibold mt-0">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-10 px-5 font-semibold">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
          <Card className="bg-card border border-border/60 rounded-2xl p-6 shadow-md shadow-black/5 dark:shadow-white/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
               <Package className="h-32 w-32" />
            </div>
            <h3 className="text-lg font-bold tracking-tight mb-6 relative z-10">Properties</h3>
            {isEditing ? (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-5 relative z-10">
                  <FormField control={editForm.control} name="seedName" render={({ field }) => (
                    <FormItem><FormLabel className="text-[13px] font-semibold text-foreground/80">Seed Name</FormLabel><FormControl><Input className="h-10 rounded-xl bg-muted/40 border-border/50 text-[14px]" {...field} /></FormControl></FormItem>
                  )}/>
                  <FormField control={editForm.control} name="batchNumber" render={({ field }) => (
                    <FormItem><FormLabel className="text-[13px] font-semibold text-foreground/80">Batch Number</FormLabel><FormControl><Input className="h-10 rounded-xl bg-muted/40 border-border/50 text-[14px] font-mono" {...field} /></FormControl></FormItem>
                  )}/>
                  <FormField control={editForm.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel className="text-[13px] font-semibold text-foreground/80">Quantity</FormLabel><FormControl><Input type="number" className="h-10 rounded-xl bg-muted/40 border-border/50 text-[14px]" {...field} /></FormControl></FormItem>
                  )}/>
                  <FormField control={editForm.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel className="text-[13px] font-semibold text-foreground/80">Location</FormLabel><FormControl><Input className="h-10 rounded-xl bg-muted/40 border-border/50 text-[14px]" {...field} /></FormControl></FormItem>
                  )}/>
                  <FormField control={editForm.control} name="expiryDate" render={({ field }) => (
                    <FormItem><FormLabel className="text-[13px] font-semibold text-foreground/80">Expiry Date</FormLabel><FormControl><Input type="date" className="h-10 rounded-xl bg-muted/40 border-border/50 text-[14px]" {...field} /></FormControl></FormItem>
                  )}/>
                  <Button type="submit" className="w-full mt-6 h-11 rounded-xl font-semibold shadow-md" disabled={updateAsset.isPending}>
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70">Quantity</p>
                    <p className="text-[15px] font-bold text-foreground mt-0.5">{asset.quantity.toLocaleString()} units</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70">Location</p>
                    <p className="text-[15px] font-bold text-foreground mt-0.5">{asset.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70">Expiry</p>
                    <p className="text-[15px] font-bold text-foreground mt-0.5">{format(new Date(asset.expiryDate), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-card border border-border/60 rounded-2xl p-6 shadow-md shadow-black/5 dark:shadow-white/5">
            <h3 className="text-lg font-bold tracking-tight mb-6">Log Event</h3>
            <Form {...movementForm}>
              <form onSubmit={movementForm.handleSubmit(onMovementSubmit)} className="space-y-5">
                <FormField control={movementForm.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-foreground/80">Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/50 text-[14px]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Stored" className="rounded-lg py-2">Stored</SelectItem>
                        <SelectItem value="Dispatched" className="rounded-lg py-2">Dispatched</SelectItem>
                        <SelectItem value="Delivered" className="rounded-lg py-2">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}/>
                <FormField control={movementForm.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-foreground/80">Location</FormLabel>
                    <FormControl><Input placeholder="e.g. Warehouse B" className="h-10 rounded-xl bg-muted/40 border-border/50 text-[14px]" {...field} /></FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}/>
                <FormField control={movementForm.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-foreground/80">Notes (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Details..." className="resize-none min-h-[80px] rounded-xl bg-muted/40 border-border/50 text-[14px]" {...field} /></FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}/>
                <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-md mt-2" disabled={createHistory.isPending}>
                  {createHistory.isPending ? "Logging..." : "Log Event"}
                </Button>
              </form>
            </Form>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-card border border-border/60 rounded-2xl shadow-md shadow-black/5 dark:shadow-white/5 min-h-[600px] flex flex-col">
            <div className="px-8 py-6 border-b border-border/60 bg-muted/20">
              <h3 className="text-lg font-bold tracking-tight">Timeline</h3>
            </div>
            <div className="p-8 flex-1">
              {isHistoryLoading ? (
                <div className="space-y-10">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-5">
                      <div className="h-8 w-8 rounded-full bg-muted/60 animate-pulse" />
                      <div className="space-y-3 flex-1 pt-1">
                        <div className="h-4 w-1/3 bg-muted/60 animate-pulse rounded-md" />
                        <div className="h-3 w-1/2 bg-muted/60 animate-pulse rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : history?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
                    <Activity className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">No history yet</p>
                  <p className="text-[15px] text-muted-foreground mt-1.5">Log a movement event to start tracking.</p>
                </div>
              ) : (
                <div className="relative border-l-[3px] border-muted ml-4 space-y-10 py-2">
                  {history?.map((event, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, type: "spring" as const, stiffness: 300, damping: 24 }}
                      key={event.id} 
                      className="relative pl-10 group"
                    >
                      <div className="absolute -left-[19px] top-0 h-9 w-9 rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 bg-muted/10 hover:bg-muted/30 p-5 rounded-2xl border border-transparent hover:border-border/50 transition-all duration-300 -mt-3">
                        <div>
                          <p className="text-[16px] font-bold text-foreground">{event.type}</p>
                          <p className="text-[14px] text-muted-foreground mt-1">
                            <span className="font-semibold text-foreground/80">{event.location}</span>
                          </p>
                          {event.notes && (
                            <p className="text-[14px] text-muted-foreground mt-3 bg-card p-3 rounded-xl border border-border/60 max-w-md leading-relaxed shadow-sm">
                              {event.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-[13px] font-medium text-muted-foreground whitespace-nowrap font-mono bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
                          {format(new Date(event.timestamp), "MMM d, yyyy")}
                          <span className="mx-2 text-muted-foreground/40">•</span>
                          {format(new Date(event.timestamp), "h:mm a")}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
