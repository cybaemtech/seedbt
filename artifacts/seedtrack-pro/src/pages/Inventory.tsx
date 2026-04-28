import { useState } from "react";
import { useListAssets, useDeleteAsset, getListAssetsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Search, Plus, Filter, ArrowRight, MoreHorizontal, Eye, Edit2, Trash2, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function Inventory() {
  const { data: assetsRaw, isLoading } = useListAssets();
  const assets = Array.isArray(assetsRaw) ? assetsRaw : [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const deleteAsset = useDeleteAsset();
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = 
      asset.seedName.toLowerCase().includes(search.toLowerCase()) || 
      asset.batchNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = () => {
    if (!assetToDelete) return;
    deleteAsset.mutate({ id: assetToDelete }, {
      onSuccess: () => {
        toast.success("Batch deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setAssetToDelete(null);
      },
      onError: () => toast.error("Failed to delete batch")
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Fresh":
        return (
          <div className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-primary/90">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
            Fresh
          </div>
        );
      case "Expiring":
        return (
          <div className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Expiring
          </div>
        );
      case "Expired":
        return (
          <div className="inline-flex items-center rounded-md border border-destructive/20 bg-destructive/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-destructive"></span>
            Expired
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="p-8 md:p-10 space-y-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Seed Inventory</h1>
          <p className="text-base text-muted-foreground mt-2">Manage and track all seed batches.</p>
        </div>
        <Link href="/inventory/new">
          <Button className="gap-2 shadow-md hover:shadow-lg transition-all rounded-xl h-10 px-5 font-semibold active:scale-[0.97]">
            <Plus className="h-4 w-4" />
            Register Batch
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center bg-card p-2 border border-border/60 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by seed name or batch..."
            className="pl-11 w-full bg-transparent border-none h-11 text-[15px] focus-visible:ring-0 shadow-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-[1px] h-8 bg-border/60 hidden sm:block"></div>
        <div className="flex items-center gap-2 w-full sm:w-[200px] px-2 pb-2 sm:pb-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full bg-muted/40 border-border/50 h-10 rounded-xl font-medium focus:ring-1 focus:ring-primary/30">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="All" className="rounded-lg">All Statuses</SelectItem>
              <SelectItem value="Fresh" className="rounded-lg">Fresh</SelectItem>
              <SelectItem value="Expiring" className="rounded-lg">Expiring Soon</SelectItem>
              <SelectItem value="Expired" className="rounded-lg">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-card rounded-2xl border border-border/60 shadow-md shadow-black/5 dark:shadow-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12 px-6">Seed</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Batch ID</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Location</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12 text-right">Qty</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Status</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Expiry</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12 w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                  <TableCell className="px-6 py-4"><div className="h-5 w-32 bg-muted/60 animate-pulse rounded-md" /></TableCell>
                  <TableCell><div className="h-5 w-24 bg-muted/60 animate-pulse rounded-md" /></TableCell>
                  <TableCell><div className="h-5 w-28 bg-muted/60 animate-pulse rounded-md" /></TableCell>
                  <TableCell><div className="h-5 w-16 bg-muted/60 animate-pulse rounded-md ml-auto" /></TableCell>
                  <TableCell><div className="h-6 w-20 bg-muted/60 animate-pulse rounded-md" /></TableCell>
                  <TableCell><div className="h-5 w-24 bg-muted/60 animate-pulse rounded-md" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : filteredAssets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-[450px] text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
                      <PackageSearch className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">No assets found</p>
                    {search || statusFilter !== "All" ? (
                      <p className="text-sm mt-2 mb-6">Adjust your filters to see more results.</p>
                    ) : (
                      <p className="text-sm mt-2 mb-6">Your inventory is empty. Get started by adding a new batch.</p>
                    )}
                    {(!search && statusFilter === "All") && (
                      <Link href="/inventory/new">
                        <Button className="h-10 px-6 rounded-xl font-semibold shadow-sm active:scale-[0.97]">Register Batch</Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filteredAssets?.map((asset, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                    key={asset.id} 
                    className="group hover:bg-muted/30 transition-colors duration-200 border-b border-border/40 last:border-0"
                  >
                    <TableCell className="font-semibold text-[15px] text-foreground py-4 px-6">{asset.seedName}</TableCell>
                    <TableCell className="font-mono text-[13px] font-medium text-muted-foreground bg-muted/20 rounded px-2">{asset.batchNumber}</TableCell>
                    <TableCell className="text-[14px] font-medium text-muted-foreground">{asset.location}</TableCell>
                    <TableCell className="text-right text-[15px]">
                      <span className={asset.quantity < 50 ? "text-amber-600 dark:text-amber-500 font-bold" : "font-semibold text-foreground/80"}>
                        {asset.quantity.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(asset.status)}
                    </TableCell>
                    <TableCell className="text-[14px] font-medium text-muted-foreground">
                      {format(new Date(asset.expiryDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-muted focus-visible:ring-1 focus-visible:ring-primary/50">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border-border/60">
                          <DropdownMenuItem onClick={() => setLocation(`/inventory/${asset.id}`)} className="text-[13px] font-medium cursor-pointer rounded-lg py-2">
                            <Eye className="mr-2.5 h-4 w-4 text-muted-foreground" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/inventory/${asset.id}?edit=true`)} className="text-[13px] font-medium cursor-pointer rounded-lg py-2">
                            <Edit2 className="mr-2.5 h-4 w-4 text-muted-foreground" />
                            Edit Batch
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-border/60" />
                          <DropdownMenuItem 
                            onClick={() => setAssetToDelete(asset.id)}
                            className="text-[13px] font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg py-2"
                          >
                            <Trash2 className="mr-2.5 h-4 w-4" />
                            Delete Batch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </motion.div>

      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-border/60 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Batch</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px]">
              Are you sure you want to delete this batch? This action cannot be undone and will remove all movement history associated with it.
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

    </motion.div>
  );
}
