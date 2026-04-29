import { useGetAnalytics } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  MapPin,
  DollarSign,
  AlertTriangle,
  Download,
} from "lucide-react";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};
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

export default function Analytics() {
  const { data: analytics, isLoading } = useGetAnalytics();

  const handleExportInventory = () => window.open("/api/reports/inventory", "_blank");
  const handleExportExpiry = () => window.open("/api/reports/expiry", "_blank");

  if (isLoading) {
    return (
      <div className="p-8 md:p-10 space-y-8 max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalValue = analytics?.totalInventoryValue ?? 0;
  const riskValue = analytics?.riskValue ?? 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="p-8 md:p-10 space-y-10 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-base text-muted-foreground mt-2">Deep insights into your seed inventory operations.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={handleExportInventory} className="h-10 px-4 rounded-xl font-semibold gap-2 border-border/60 text-sm">
            <Download className="h-4 w-4" /> Inventory Report
          </Button>
          <Button variant="outline" onClick={handleExportExpiry} className="h-10 px-4 rounded-xl font-semibold gap-2 border-border/60 text-sm">
            <Download className="h-4 w-4" /> Expiry Report
          </Button>
        </div>
      </motion.div>

      {/* Financial KPIs */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-border/60 shadow-md overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Total Inventory Value</p>
              <p className="text-3xl font-bold tracking-tight mt-1">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">Across all active batches</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-md overflow-hidden bg-gradient-to-br from-destructive/5 to-transparent">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Value at Risk</p>
              <p className="text-3xl font-bold tracking-tight text-destructive mt-1">
                ${riskValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                {totalValue > 0 ? ((riskValue / totalValue) * 100).toFixed(1) : 0}% of total at risk
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stock Over Time */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-border/60 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Stock Over Time</h3>
                <p className="text-[12px] text-muted-foreground">Cumulative inventory quantity by registration date</p>
              </div>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.stockOverTime ?? []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="quantity" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#aGrad)" activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Movement Trends + Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-border/60 shadow-md h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Movement Trends</h3>
                  <p className="text-[12px] text-muted-foreground">Monthly IN vs OUT volumes</p>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.movementTrends ?? []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="IN" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="OUT" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="TRANSFER" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-border/60 shadow-md h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PieIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Category Distribution</h3>
                  <p className="text-[12px] text-muted-foreground">Quantity breakdown by seed category</p>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip {...tooltipStyle} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                    <Pie
                      data={analytics?.categoryDistribution ?? []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    >
                      {(analytics?.categoryDistribution ?? []).map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stock per Location */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-border/60 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Stock by Location</h3>
                <p className="text-[12px] text-muted-foreground">Current inventory distribution across storage locations</p>
              </div>
            </div>
            <div className="space-y-3">
              {(analytics?.locationStock ?? []).map((loc, i) => {
                const maxQty = Math.max(...(analytics?.locationStock ?? []).map((l) => l.quantity), 1);
                const pct = (loc.quantity / maxQty) * 100;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-36 shrink-0">
                      <p className="text-[13px] font-semibold truncate">{loc.location}</p>
                      <p className="text-[11px] text-muted-foreground">{loc.batches} batch{loc.batches !== 1 ? "es" : ""}</p>
                    </div>
                    <div className="flex-1 h-7 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.07 }}
                        className="h-full rounded-full bg-primary/70"
                      />
                    </div>
                    <div className="w-20 text-right shrink-0">
                      <span className="text-[14px] font-bold">{loc.quantity.toLocaleString()}</span>
                      <span className="text-[12px] text-muted-foreground ml-1">units</span>
                    </div>
                  </div>
                );
              })}
              {(analytics?.locationStock ?? []).length === 0 && (
                <p className="text-center text-muted-foreground py-10 text-sm">No location data available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
