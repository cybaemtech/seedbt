import { Router, type IRouter } from "express";
import { getAllAssets, getAllMovements } from "../lib/store";
import { withStatusAll } from "../lib/status";

const router: IRouter = Router();

router.get("/analytics", async (_req, res) => {
  const [assetsRaw, movements] = await Promise.all([getAllAssets(), getAllMovements()]);
  const assets = withStatusAll(assetsRaw);

  // 1. Stock over time — cumulative quantity by creation date
  const sorted = [...assetsRaw].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const buckets = new Map<string, number>();
  let running = 0;
  for (const a of sorted) {
    running += a.quantity;
    const day = a.createdAt.slice(0, 10);
    buckets.set(day, running);
  }
  const stockOverTime = Array.from(buckets.entries()).map(([date, quantity]) => ({
    date,
    quantity,
    label: new Date(date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  // 2. Movement trends by month
  const movBuckets = new Map<string, { IN: number; OUT: number; TRANSFER: number }>();
  for (const m of movements) {
    const month = m.date.slice(0, 7);
    const existing = movBuckets.get(month) ?? { IN: 0, OUT: 0, TRANSFER: 0 };
    existing[m.movementType] += m.quantity;
    movBuckets.set(month, existing);
  }
  const movementTrends = Array.from(movBuckets.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  // 3. Category distribution
  const catMap = new Map<string, { value: number; totalValue: number }>();
  for (const a of assets) {
    const cat = a.category ?? "Other";
    const existing = catMap.get(cat) ?? { value: 0, totalValue: 0 };
    existing.value += a.quantity;
    existing.totalValue += a.quantity * (a.pricePerUnit ?? 0);
    catMap.set(cat, existing);
  }
  const categoryDistribution = Array.from(catMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value);

  // 4. Stock per location
  const locMap = new Map<string, { quantity: number; batches: number }>();
  for (const a of assets) {
    const loc = a.location;
    const existing = locMap.get(loc) ?? { quantity: 0, batches: 0 };
    existing.quantity += a.quantity;
    existing.batches += 1;
    locMap.set(loc, existing);
  }
  const locationStock = Array.from(locMap.entries())
    .map(([location, data]) => ({ location, ...data }))
    .sort((a, b) => b.quantity - a.quantity);

  // 5. Financial metrics
  const totalInventoryValue = assets.reduce((sum, a) => sum + a.quantity * (a.pricePerUnit ?? 0), 0);
  const riskValue = assets
    .filter((a) => a.status === "Expiring" || a.status === "Expired")
    .reduce((sum, a) => sum + a.quantity * (a.pricePerUnit ?? 0), 0);

  res.json({
    stockOverTime,
    movementTrends,
    categoryDistribution,
    locationStock,
    totalInventoryValue,
    riskValue,
  });
});

export default router;
