import { useMemo } from "react";
import { useListAssets } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, AlertOctagon, DollarSign, PieChart as PieIcon } from "lucide-react";

const PIE_COLORS = [
  "hsl(var(--primary))", "#f59e0b", "#3b82f6", "#ef4444",
  "#10b981", "#8b5cf6", "#ec4899", "#14b8a6",
];

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "12px",
    fontSize: "13px",
  },
  labelStyle: { fontWeight: 700 },
};

export function DashboardCharts() {
  const { data: assetsRaw, isLoading } = useListAssets();
  const assets = useMemo(() => (Array.isArray(assetsRaw) ? assetsRaw : []), [assetsRaw]);

  const inventoryOverTime = useMemo(() => {
    if (assets.length === 0) return [];
    const sorted = [...assets]
      .filter((a) => Number.isFinite(new Date(a.createdAt).getTime()))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const buckets = new Map<string, number>();
    let running = 0;
    for (const a of sorted) {
      running += a.quantity;
      buckets.set(a.createdAt.slice(0, 10), running);
    }
    return Array.from(buckets.entries()).map(([date, qty]) => ({
      date,
      quantity: qty,
      label: new Date(date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));
  }, [assets]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assets) {
      const cat = (a as any).category ?? "Other";
      map.set(cat, (map.get(cat) ?? 0) + a.quantity);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const statusBarData = useMemo(() => {
    let fresh = 0, expiring = 0, expired = 0;
    for (const a of assets) {
      if (a.status === "Fresh") fresh += a.quantity;
      else if (a.status === "Expiring") expiring += a.quantity;
      else expired += a.quantity;
    }
    return [
      { name: "Fresh", quantity: fresh, fill: "hsl(var(--primary))" },
      { name: "Expiring", quantity: expiring, fill: "#f59e0b" },
      { name: "Expired", quantity: expired, fill: "hsl(var(--destructive))" },
    ];
  }, [assets]);

  const risk = useMemo(() => {
    let quantity = 0, batchCount = 0, value = 0;
    for (const a of assets) {
      if (a.status === "Expiring" || a.status === "Expired") {
        quantity += a.quantity;
        batchCount += 1;
        value += a.quantity * ((a as any).pricePerUnit ?? 0);
      }
    }
    return { quantity, batchCount, value };
  }, [assets]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[320px] bg-muted animate-pulse rounded-2xl border border-border/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Risk Summary */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/60 rounded-2xl shadow-md overflow-hidden bg-gradient-to-br from-amber-500/5 via-card to-destructive/5 relative">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
            <AlertOctagon className="absolute -right-10 -top-10 h-64 w-64" />
          </div>
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <AlertOctagon className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Risk Summary</h3>
                <p className="text-[13px] text-muted-foreground">Combined exposure from expiring and expired stock</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card/60 backdrop-blur border border-border/60 rounded-xl p-4">
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">At-Risk Batches</p>
                <p className="text-2xl font-bold tracking-tight mt-1.5 text-amber-700 dark:text-amber-400">{risk.batchCount}</p>
              </div>
              <div className="bg-card/60 backdrop-blur border border-border/60 rounded-xl p-4">
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Total Expiring Qty</p>
                <p className="text-2xl font-bold tracking-tight mt-1.5">
                  {risk.quantity.toLocaleString()} <span className="text-sm text-muted-foreground font-medium">units</span>
                </p>
              </div>
              <div className="bg-card/60 backdrop-blur border border-border/60 rounded-xl p-4">
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Estimated Loss Value</p>
                <p className="text-2xl font-bold tracking-tight mt-1.5 text-destructive flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {risk.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Over Time */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-border/60 rounded-2xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Inventory Over Time</h3>
                  <p className="text-[12px] text-muted-foreground">Cumulative quantity registered into the system</p>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={inventoryOverTime} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Area type="monotone" dataKey="quantity" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#invGradient)" activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 rounded-2xl shadow-md h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PieIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Seed Categories</h3>
                  <p className="text-[12px] text-muted-foreground">Distribution by category</p>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip {...tooltipStyle} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3} stroke="hsl(var(--card))" strokeWidth={2}>
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 rounded-2xl shadow-md h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertOctagon className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Expiring vs Fresh</h3>
                  <p className="text-[12px] text-muted-foreground">Stock quantity by status</p>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBarData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                    <Bar dataKey="quantity" radius={[10, 10, 0, 0]} maxBarSize={80} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
