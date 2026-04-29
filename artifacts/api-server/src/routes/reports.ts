import { Router, type IRouter } from "express";
import { getAllAssets, getAllMovements, getAsset } from "../lib/store";
import { withStatusAll, computeDaysRemaining, computeExpiryPriority } from "../lib/status";

const router: IRouter = Router();

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

router.get("/reports/inventory", async (_req, res) => {
  const assets = withStatusAll(await getAllAssets());
  const headers = [
    "Batch Number", "Seed Name", "Category", "Supplier",
    "Quantity", "Location", "Status", "Expiry Date",
    "Days Remaining", "Expiry Priority", "Germination Rate (%)",
    "Price Per Unit", "Total Value", "Production Date", "Created At",
  ];
  const rows = assets.map((a) => [
    a.batchNumber,
    a.seedName,
    a.category ?? "",
    a.supplier ?? "",
    String(a.quantity),
    a.location,
    a.status,
    a.expiryDate,
    String(computeDaysRemaining(a.expiryDate)),
    computeExpiryPriority(a.expiryDate),
    a.germinationRate != null ? String(a.germinationRate) : "",
    a.pricePerUnit != null ? String(a.pricePerUnit) : "",
    a.pricePerUnit != null ? String(a.quantity * a.pricePerUnit) : "",
    a.productionDate ?? "",
    a.createdAt,
  ]);
  const csv = toCsv(headers, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=inventory-report.csv");
  res.send(csv);
});

router.get("/reports/expiry", async (_req, res) => {
  const assets = withStatusAll(await getAllAssets());
  const atRisk = assets
    .filter((a) => a.status === "Expiring" || a.status === "Expired")
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1));

  const headers = [
    "Batch Number", "Seed Name", "Category", "Supplier",
    "Quantity", "Location", "Status",
    "Expiry Date", "Days Remaining", "Expiry Priority",
    "Price Per Unit", "Value at Risk",
  ];
  const rows = atRisk.map((a) => [
    a.batchNumber,
    a.seedName,
    a.category ?? "",
    a.supplier ?? "",
    String(a.quantity),
    a.location,
    a.status,
    a.expiryDate,
    String(computeDaysRemaining(a.expiryDate)),
    computeExpiryPriority(a.expiryDate),
    a.pricePerUnit != null ? String(a.pricePerUnit) : "",
    a.pricePerUnit != null ? String(a.quantity * a.pricePerUnit) : "",
  ]);
  const csv = toCsv(headers, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=expiry-report.csv");
  res.send(csv);
});

router.get("/reports/movements", async (_req, res) => {
  const movements = await getAllMovements();
  const headers = [
    "Date", "Movement Type", "Seed Name", "Batch Number",
    "Quantity", "From Location", "To Location", "Notes",
  ];
  const rows = await Promise.all(
    movements.map(async (m) => {
      const asset = await getAsset(m.assetId);
      return [
        m.date,
        m.movementType,
        asset?.seedName ?? "Unknown",
        asset?.batchNumber ?? "—",
        String(m.quantity),
        m.fromLocation ?? "",
        m.toLocation ?? "",
        m.notes ?? "",
      ];
    }),
  );
  const csv = toCsv(headers, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=movements-report.csv");
  res.send(csv);
});

export default router;
