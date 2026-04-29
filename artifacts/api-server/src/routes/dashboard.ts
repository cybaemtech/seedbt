import { Router, type IRouter } from "express";
import { getAllAssets, getAllHistoryFlattened, getAsset } from "../lib/store";
import {
  EXPIRING_WINDOW_DAYS,
  LOW_STOCK_THRESHOLD,
  withStatusAll,
} from "../lib/status";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const assets = withStatusAll(await getAllAssets());
  const totalAssets = assets.length;
  const totalQuantity = assets.reduce((sum, a) => sum + a.quantity, 0);
  const expiringSoon = assets.filter((a) => a.status === "Expiring").length;
  const expired = assets.filter((a) => a.status === "Expired").length;
  const fresh = assets.filter((a) => a.status === "Fresh").length;
  const lowStock = assets.filter((a) => a.quantity < LOW_STOCK_THRESHOLD).length;

  const totalInventoryValue = assets.reduce((sum, a) => {
    return sum + a.quantity * (a.pricePerUnit ?? 0);
  }, 0);

  const riskValue = assets
    .filter((a) => a.status === "Expiring" || a.status === "Expired")
    .reduce((sum, a) => sum + a.quantity * (a.pricePerUnit ?? 0), 0);

  res.json({
    totalAssets,
    totalQuantity,
    expiringSoon,
    lowStock,
    expired,
    fresh,
    totalInventoryValue,
    riskValue,
  });
});

router.get("/dashboard/alerts", async (_req, res) => {
  const assets = withStatusAll(await getAllAssets());
  const expiringSoon = assets
    .filter((a) => a.status === "Expiring")
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1));
  const expired = assets
    .filter((a) => a.status === "Expired")
    .sort((a, b) => (a.expiryDate < b.expiryDate ? 1 : -1));
  const lowStock = assets
    .filter((a) => a.quantity < LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.quantity - b.quantity);

  res.json({ expiringSoon, expired, lowStock });
});

router.get("/dashboard/recent-activity", async (_req, res) => {
  const events = (await getAllHistoryFlattened()).slice(0, 15);
  const enriched = await Promise.all(
    events.map(async (event) => {
      const asset = await getAsset(event.assetId);
      return {
        event,
        seedName: asset?.seedName ?? "Unknown asset",
        batchNumber: asset?.batchNumber ?? "—",
      };
    }),
  );
  res.json(enriched);
});

void EXPIRING_WINDOW_DAYS;

export default router;
