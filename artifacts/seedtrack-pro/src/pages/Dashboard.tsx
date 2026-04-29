import { useGetDashboardSummary, useGetAlerts, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package, AlertTriangle, AlertCircle, CheckCircle,
  PlusCircle, ArrowRight, TrendingUp, Sparkles, Activity,
  DollarSign, ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

const generateTrendData = (baseValue: number, volatility = 0.2) =>
  Array.from({ length: 14 }).map((_, i) => ({
    value: baseValue + Math.sin(i) * baseValue * volatility + i * baseValue * 0.05,
  }));

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: alerts, isLoading: isAlertsLoading } = useGetAlerts();
  const { data: recentActivityRaw, isLoading: isActivityLoading } = useGetRecentActivity();
  const recentActivity = Array.isArray(recentActivityRaw) ? recentActivityRaw : [];

  if (isSummaryLoading || isAlertsLoading || isActivityLoading) {
    return (
      <div className="p-8 md:p-10 space-y-8 max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse shadow-sm border-border/50 rounded-2xl h-36" />
          ))}
        </div>
      </div>
    );
  }

  const totalTrend = summary ? generateTrendData(summary.totalAssets, 0.1) : [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="p-8 md:p-10 space-y-10 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Operations Overview</h1>
        <p className="text-base text-muted-foreground mt-2">Monitor your seed inventory health and operations.</p>
      </motion.div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="shadow-md shadow-black/5 dark:shadow-white/5 border-border/60 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Total Assets</p>
                  <p className="text-3xl font-bold tracking-tight">{summary?.totalAssets ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <div className="flex items-center text-primary font-semibold">
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  <span>+12%</span>
                </div>
                <div className="h-8 w-20 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={totalTrend}>
                      <YAxis domain={["dataMin", "dataMax"]} hide />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-md shadow-black/5 dark:shadow-white/5 border-border/60 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Fresh Stock</p>
                  <p className="text-3xl font-bold tracking-tight">{summary?.fresh ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground font-medium">
                <span>Healthy batches ready to ship</span>
                <span className="font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">
                  {(summary?.fresh ?? 0) > 0 ? Math.round(((summary?.fresh ?? 0) / (summary?.totalAssets || 1)) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-md shadow-black/5 dark:shadow-white/5 border-border/60 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Expiring</p>
                  <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{summary?.expiringSoon ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </div>
              </div>
              <div className="mt-5 text-sm text-muted-foreground font-medium">
                <span>Within next 30 days</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-md shadow-black/5 dark:shadow-white/5 border-border/60 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Expired</p>
                  <p className="text-3xl font-bold tracking-tight text-destructive">{summary?.expired ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <div className="mt-5 text-sm text-muted-foreground font-medium">
                <span>Requires immediate review</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Financial KPIs Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="shadow-md shadow-black/5 dark:shadow-white/5 border-border/60 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group relative bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Total Inventory Value</p>
                  <p className="text-3xl font-bold tracking-tight">
                    ${(summary?.totalInventoryValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-5 text-sm text-muted-foreground font-medium">
                Based on price per unit across all batches
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-md shadow-black/5 dark:shadow-white/5 border-border/60 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group relative bg-gradient-to-br from-destructive/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Value at Risk</p>
                  <p className="text-3xl font-bold tracking-tight text-destructive">
                    ${(summary?.riskValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <div className="mt-5 text-sm text-muted-foreground font-medium">
                {(summary?.totalInventoryValue ?? 0) > 0
                  ? `${(((summary?.riskValue ?? 0) / (summary?.totalInventoryValue ?? 1)) * 100).toFixed(1)}% of total value in expiring/expired stock`
                  : "Value from expiring & expired batches"}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <DashboardCharts />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-5">
          <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
          <Card className="shadow-md shadow-black/5 dark:shadow-white/5 border-border/60 rounded-2xl overflow-hidden bg-card">
            <CardContent className="p-0">
              {recentActivity.length > 0 ? (
                <div className="relative border-l-[3px] border-muted ml-8 my-8 space-y-8">
                  {recentActivity.map((activity, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.3, type: "spring" as const, stiffness: 300, damping: 24 }}
                      key={i}
                      className="relative pl-8 pr-6 group"
                    >
                      <div className="absolute -left-[1.3rem] top-1.5 h-6 w-6 rounded-full border-4 border-card bg-muted flex items-center justify-center shadow-sm group-hover:scale-125 transition-transform duration-300">
                        {activity.event.type === "Created" && <PlusCircle className="h-3 w-3 text-primary" />}
                        {activity.event.type === "Stored" && <Package className="h-3 w-3 text-blue-500" />}
                        {activity.event.type === "Dispatched" && <ArrowRight className="h-3 w-3 text-amber-500" />}
                        {activity.event.type === "Delivered" && <CheckCircle className="h-3 w-3 text-green-500" />}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-xl hover:bg-muted/50 transition-colors -mt-3 border border-transparent hover:border-border/50">
                        <div className="space-y-1.5">
                          <p className="text-[15px] leading-snug">
                            <span className="font-semibold text-foreground">{activity.seedName}</span>
                            <span className="text-muted-foreground"> was </span>
                            <span className="font-medium lowercase text-foreground">{activity.event.type}</span>
                            <span className="text-muted-foreground"> at </span>
                            <span className="font-medium text-foreground">{activity.event.location}</span>
                          </p>
                          <div className="flex text-[13px] text-muted-foreground items-center gap-2.5">
                            <span className="font-mono font-medium bg-muted/80 px-2 py-0.5 rounded-md text-[11px]">{activity.batchNumber}</span>
                            <span>•</span>
                            <span>{format(new Date(activity.event.timestamp), "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                        <Link href={`/inventory/${activity.event.assetId}`}>
                          <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 text-xs font-semibold rounded-lg translate-x-2 group-hover:translate-x-0">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-base font-semibold text-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-1">System events will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-bold tracking-tight">Attention Required</h2>
          <Card className="shadow-md shadow-black/5 dark:shadow-white/5 border-border/60 rounded-2xl overflow-hidden bg-card">
            <Tabs defaultValue="expiring" className="w-full">
              <div className="px-5 pt-5 pb-2 border-b border-border/60">
                <TabsList className="grid w-full grid-cols-3 bg-muted/60 h-11 p-1 rounded-xl">
                  <TabsTrigger value="expiring" className="text-[13px] font-semibold rounded-lg data-[state=active]:shadow-sm">
                    Expiring
                    {(alerts?.expiringSoon?.length ?? 0) > 0 && (
                      <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                        {alerts?.expiringSoon?.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="text-[13px] font-semibold rounded-lg data-[state=active]:shadow-sm">
                    Expired
                    {(alerts?.expired?.length ?? 0) > 0 && (
                      <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-[11px] font-bold text-destructive">
                        {alerts?.expired?.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="lowstock" className="text-[13px] font-semibold rounded-lg data-[state=active]:shadow-sm">
                    Low Stock
                    {(alerts?.lowStock?.length ?? 0) > 0 && (
                      <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/10 text-[11px] font-bold text-muted-foreground">
                        {alerts?.lowStock?.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-0 min-h-[350px]">
                {(["expiring", "expired", "lowstock"] as const).map((tab) => {
                  const list = tab === "expiring" ? alerts?.expiringSoon : tab === "expired" ? alerts?.expired : alerts?.lowStock;
                  return (
                    <TabsContent key={tab} value={tab} className="m-0 focus-visible:outline-none">
                      {list && list.length > 0 ? (
                        <div className="divide-y divide-border/60">
                          {list.slice(0, 5).map((asset) => (
                            <Link key={asset.id} href={`/inventory/${asset.id}`}>
                              <div className="p-5 flex flex-col gap-1.5 hover:bg-muted/40 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start">
                                  <span className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors">{asset.seedName}</span>
                                  {tab === "lowstock" ? (
                                    <span className="text-[11px] font-bold font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md uppercase tracking-wide">
                                      {asset.quantity} left
                                    </span>
                                  ) : tab === "expired" ? (
                                    <span className="text-[11px] font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-md uppercase tracking-wide">
                                      Expired
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-md uppercase tracking-wide">
                                      {format(new Date(asset.expiryDate), "MMM d")}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[13px] text-muted-foreground font-mono font-medium">{asset.batchNumber}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-primary/50" />
                          </div>
                          <p className="text-base font-semibold text-foreground">All good here!</p>
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </div>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
