import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListAssets } from "@workspace/api-client-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  Plus,
  Filter,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface StockMovement {
  id: string;
  assetId: string;
  seedName: string;
  batchNumber: string;
  movementType: "IN" | "OUT" | "TRANSFER";
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

const movementSchema = z.object({
  assetId: z.string().min(1, "Select a batch"),
  movementType: z.enum(["IN", "OUT", "TRANSFER"]),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});
type MovementForm = z.infer<typeof movementSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function MovementTypeBadge({ type }: { type: "IN" | "OUT" | "TRANSFER" }) {
  if (type === "IN")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        <ArrowDown className="h-3 w-3" /> IN
      </span>
    );
  if (type === "OUT")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
        <ArrowUp className="h-3 w-3" /> OUT
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
      <ArrowLeftRight className="h-3 w-3" /> TRANSFER
    </span>
  );
}

export default function Movements() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: assetsRaw } = useListAssets();
  const assets = Array.isArray(assetsRaw) ? assetsRaw : [];

  const { data: movementsRaw = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ["movements", typeFilter, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "All") params.set("movementType", typeFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      const res = await fetch(`/api/movements?${params.toString()}`);
      return res.json();
    },
  });

  const movements = Array.isArray(movementsRaw) ? movementsRaw : [];

  const filtered = useMemo(
    () =>
      movements.filter(
        (m) =>
          m.seedName?.toLowerCase().includes(search.toLowerCase()) ||
          m.batchNumber?.toLowerCase().includes(search.toLowerCase()),
      ),
    [movements, search],
  );

  const createMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create movement");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Stock movement recorded");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      assetId: "",
      movementType: "IN",
      quantity: 1,
      fromLocation: "",
      toLocation: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const watchType = form.watch("movementType");

  const totalIn = filtered.filter((m) => m.movementType === "IN").reduce((s, m) => s + m.quantity, 0);
  const totalOut = filtered.filter((m) => m.movementType === "OUT").reduce((s, m) => s + m.quantity, 0);
  const totalTransfer = filtered.filter((m) => m.movementType === "TRANSFER").reduce((s, m) => s + m.quantity, 0);

  const handleExport = () => {
    window.open("/api/reports/movements", "_blank");
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
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Stock Movements</h1>
          <p className="text-base text-muted-foreground mt-2">Track all incoming, outgoing, and transferred stock.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} className="h-10 px-4 rounded-xl font-semibold gap-2 border-border/60">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-5 rounded-xl font-semibold gap-2 shadow-md">
                <Plus className="h-4 w-4" /> Move Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-border/60 shadow-xl max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl">Record Stock Movement</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-5 pt-2">
                  <FormField control={form.control} name="assetId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold">Batch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/50">
                            <SelectValue placeholder="Select batch..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl max-h-60">
                          {assets.map((a) => (
                            <SelectItem key={a.id} value={a.id} className="rounded-lg">
                              <span className="font-medium">{a.seedName}</span>
                              <span className="ml-2 text-muted-foreground font-mono text-xs">{a.batchNumber}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}/>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="movementType" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-semibold">Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="IN" className="rounded-lg">📥 Stock IN</SelectItem>
                            <SelectItem value="OUT" className="rounded-lg">📤 Stock OUT</SelectItem>
                            <SelectItem value="TRANSFER" className="rounded-lg">🔄 Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="quantity" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-semibold">Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} className="h-10 rounded-xl bg-muted/40 border-border/50" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}/>
                  </div>

                  {(watchType === "OUT" || watchType === "TRANSFER") && (
                    <FormField control={form.control} name="fromLocation" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-semibold">From Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Warehouse A" className="h-10 rounded-xl bg-muted/40 border-border/50" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}/>
                  )}

                  {(watchType === "IN" || watchType === "TRANSFER") && (
                    <FormField control={form.control} name="toLocation" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-semibold">To Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Cold Storage 1" className="h-10 rounded-xl bg-muted/40 border-border/50" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}/>
                  )}

                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold">Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-10 rounded-xl bg-muted/40 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}/>

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Details about this movement..." className="resize-none min-h-[70px] rounded-xl bg-muted/40 border-border/50" {...field} />
                      </FormControl>
                    </FormItem>
                  )}/>

                  <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Recording..." : "Record Movement"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingDown className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Total IN</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{totalIn.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">units</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Total OUT</p>
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{totalOut.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">units</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <RefreshCcw className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Transfers</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalTransfer.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">units</span></p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 items-center bg-card p-2 border border-border/60 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by seed or batch..."
            className="pl-10 w-full bg-transparent border-none h-10 focus-visible:ring-0 shadow-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap px-2 pb-2 sm:pb-0">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 bg-muted/40 border-border/50 h-9 rounded-xl font-medium text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="All" className="rounded-lg">All Types</SelectItem>
              <SelectItem value="IN" className="rounded-lg">IN</SelectItem>
              <SelectItem value="OUT" className="rounded-lg">OUT</SelectItem>
              <SelectItem value="TRANSFER" className="rounded-lg">Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 w-36 rounded-xl bg-muted/40 border-border/50 text-sm font-medium"
            title="From date"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 w-36 rounded-xl bg-muted/40 border-border/50 text-sm font-medium"
            title="To date"
          />
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" className="h-9 rounded-xl text-sm" onClick={() => { setFromDate(""); setToDate(""); }}>
              Clear dates
            </Button>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl border border-border/60 shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12 px-6">Date</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Type</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Seed / Batch</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12 text-right">Quantity</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">From</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">To</TableHead>
              <TableHead className="font-bold text-[12px] text-muted-foreground uppercase tracking-wider h-12">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                  {Array(7).fill(0).map((__, j) => (
                    <TableCell key={j} className="py-4 px-4"><div className="h-4 w-24 bg-muted/60 animate-pulse rounded-md" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                      <ArrowLeftRight className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-base font-semibold text-foreground">No movements found</p>
                    <p className="text-sm mt-1">Record your first stock movement to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filtered.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    className="group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0"
                  >
                    <TableCell className="px-6 py-4 font-medium text-[14px]">
                      {format(new Date(m.date + "T00:00:00"), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <MovementTypeBadge type={m.movementType} />
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-[14px]">{m.seedName}</p>
                      <p className="text-[12px] font-mono text-muted-foreground">{m.batchNumber}</p>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[15px]">{m.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground font-medium">{m.fromLocation || <span className="text-muted-foreground/40">—</span>}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground font-medium">{m.toLocation || <span className="text-muted-foreground/40">—</span>}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground max-w-[200px] truncate">{m.notes || <span className="text-muted-foreground/40">—</span>}</TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </motion.div>
  );
}
