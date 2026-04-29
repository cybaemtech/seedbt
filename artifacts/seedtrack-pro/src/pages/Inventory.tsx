import { useState } from "react";
import { useListAssets, useDeleteAsset, getListAssetsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format, differenceInDays } from "date-fns";
import {
  Search, Plus, MoreHorizontal, Eye, Edit2, Trash2,
  PackageSearch, Download, Leaf, FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};
const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-destructive">
      🔴 Expired
    </span>
  );
  if (days < 15) return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
      🔴 Sell Now ({days}d)
    </span>
  );
  if (days <= 30) return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
      🟡 Monitor ({days}d)
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
      🟢 Safe
    </span>
  );
}

function GerminationBadge({ rate }: { rate?: number }) {
  if (rate == null) return <span className="text-muted-foreground/50 text-[13px]">—</span>;
  const color = rate >= 85 ? "text-emerald-600 dark:text-emerald-400" : rate >= 70 ? "text-amber-600" : "text-destructive";
  return (
    <span className={`font-bold text-[14px] ${color} flex items-center gap-1`}>
      <FlaskConical className="h-3.5 w-3.5" />
      {rate}%
    </span>
  );
}

export default function Inventory() {
  const { data: assetsRaw, isLoading } = useListAssets();
  const assets = Array.isArray(assetsRaw) ? assetsRaw : [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const deleteAsset = useDeleteAsset();
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  const categories = [...new Set(assets.map((a) => (a as any).category).filter(Boolean))];
  const locations = [...new Set(assets.map((a) => a.location).filter(Boolean))];

  const filtered = assets.filter((asset) => {
    const matchSearch =
      asset.seedName.toLowerCase().includes(search.toLowerCase()) ||
      asset.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      ((asset as any).supplier ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || asset.status === statusFilter;
    const matchCategory = categoryFilter === "All" || (asset as any).category === categoryFilter;
    const matchLocation = locationFilter === "All" || asset.location === locationFilter;
    return matchSearch && matchStatus && matchCategory && matchLocation;
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
      onError: () => toast.error("Failed to delete batch"),
    });
  };

  const handleExport = () => window.open("/api/reports/inventory", "_blank");

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
          <p className="text-base text-muted-foreground mt-2">
            Manage and track all seed batches. {!isLoading && <span className="font-semibold text-foreground">{assets.length} batches</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} className="h-10 px-4 rounded-xl font-semibold gap-2 border-border/60 text-sm">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Link href="/inventory/new">
            <Button className="gap-2 shadow-md hover:shadow-lg transition-all rounded-xl h-10 px-5 font-semibold active:scale-[0.97]">
              <Plus className="h-4 w-4" /> Register Batch
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 bg-card p-3 border border-border/60 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by seed, batch, or supplier..."
              className="pl-11 w-full bg-transparent border-none h-11 text-[15px] focus-visible:ring-0 shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto px-1 pb-1 sm:pb-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-muted/40 border-border/50 h-10 rounded-xl font-medium focus:ring-1 focus:ring-primary/30 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Fresh">Fresh</SelectItem>
                <SelectItem value="Expiring">Expiring Soon</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 bg-muted/40 border-border/50 h-10 rounded-xl font-medium text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40 bg-muted/40 border-border/50 h-10 rounded-xl font-medium text-sm">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-52">
                <SelectItem value="All">All Locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-card rounded-2xl border border-border/60 shadow-md shadow-black/5 dark:shadow-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12 px-6">Seed / Batch</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Category</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Location</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12 text-right">Qty</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Germination</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Expiry</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12 w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                  {Array(7).fill(0).map((__, j) => (
                    <TableCell key={j} className="px-4 py-4"><div className="h-5 w-24 bg-muted/60 animate-pulse rounded-md" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-[420px] text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
                      <PackageSearch className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">No assets found</p>
                    {search || statusFilter !== "All" || categoryFilter !== "All" || locationFilter !== "All" ? (
                      <p className="text-sm mt-2 mb-6">Adjust your filters to see more results.</p>
                    ) : (
                      <p className="text-sm mt-2 mb-6">Your inventory is empty. Get started by adding a new batch.</p>
                    )}
                    {!search && statusFilter === "All" && categoryFilter === "All" && locationFilter === "All" && (
                      <Link href="/inventory/new">
                        <Button className="h-10 px-6 rounded-xl font-semibold shadow-sm">Register Batch</Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filtered.map((asset, i) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.5) }}
                    key={asset.id}
                    className="group hover:bg-muted/30 transition-colors duration-200 border-b border-border/40 last:border-0"
                  >
                    <TableCell className="py-4 px-6">
                      <p className="font-semibold text-[15px] text-foreground flex items-center gap-2">
                        <Leaf className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                        {asset.seedName}
                      </p>
                      <p className="font-mono text-[12px] text-muted-foreground mt-0.5">{asset.batchNumber}</p>
                    </TableCell>
                    <TableCell>
                      {(asset as any).category ? (
                        <span className="text-[13px] font-medium bg-muted/60 px-2 py-0.5 rounded-lg border border-border/40">
                          {(asset as any).category}
                        </span>
                      ) : <span className="text-muted-foreground/40 text-[13px]">—</span>}
                    </TableCell>
                    <TableCell className="text-[14px] font-medium text-muted-foreground">{asset.location}</TableCell>
                    <TableCell className="text-right">
                      <span className={asset.quantity < 50 ? "text-amber-600 dark:text-amber-500 font-bold text-[15px]" : "font-semibold text-foreground/80 text-[15px]"}>
                        {asset.quantity.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <GerminationBadge rate={(asset as any).germinationRate} />
                    </TableCell>
                    <TableCell>
                      <ExpiryBadge expiryDate={asset.expiryDate} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border-border/60">
                          <DropdownMenuLabel className="text-[12px] text-muted-foreground px-2 py-1">Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setLocation(`/inventory/${asset.id}`)} className="text-[13px] font-medium cursor-pointer rounded-lg py-2">
                            <Eye className="mr-2.5 h-4 w-4 text-muted-foreground" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/inventory/${asset.id}?edit=true`)} className="text-[13px] font-medium cursor-pointer rounded-lg py-2">
                            <Edit2 className="mr-2.5 h-4 w-4 text-muted-foreground" /> Edit Batch
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-border/60" />
                          <DropdownMenuItem onClick={() => setAssetToDelete(asset.id)} className="text-[13px] font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg py-2">
                            <Trash2 className="mr-2.5 h-4 w-4" /> Delete Batch
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
              Are you sure? This will permanently delete the batch and all its movement history.
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
