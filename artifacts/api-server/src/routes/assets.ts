import { Router, type IRouter } from "express";
import {
  CreateAssetBody,
  GetAssetParams,
  UpdateAssetBody,
  UpdateAssetParams,
  DeleteAssetParams,
} from "@workspace/api-zod";
import {
  createAsset,
  deleteAsset,
  getAllAssets,
  getAsset,
  updateAsset,
} from "../lib/store";
import { withStatus, withStatusAll } from "../lib/status";

const router: IRouter = Router();

function parseDate(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const s = String(val);
  if (s.includes("T")) return s.slice(0, 10);
  return s;
}

router.get("/assets", async (_req, res) => {
  const assets = await getAllAssets();
  res.json(withStatusAll(assets));
});

router.post("/assets", async (req, res) => {
  const parsed = CreateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid asset", issues: parsed.error.issues });
    return;
  }
  const d = parsed.data as Record<string, unknown>;
  const created = await createAsset({
    seedName: String(d["seedName"]),
    batchNumber: String(d["batchNumber"]),
    quantity: Number(d["quantity"]),
    location: String(d["location"]),
    expiryDate: parseDate(d["expiryDate"]) ?? "",
    productionDate: parseDate(d["productionDate"]),
    supplier: d["supplier"] ? String(d["supplier"]) : undefined,
    category: d["category"] as import("../lib/store").SeedCategory | undefined,
    germinationRate: d["germinationRate"] != null ? Number(d["germinationRate"]) : undefined,
    pricePerUnit: d["pricePerUnit"] != null ? Number(d["pricePerUnit"]) : undefined,
  });
  res.status(201).json(withStatus(created));
});

router.get("/assets/:id", async (req, res) => {
  const params = GetAssetParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const asset = await getAsset(params.data.id);
  if (!asset) { res.status(404).json({ error: "Not found" }); return; }
  res.json(withStatus(asset));
});

router.put("/assets/:id", async (req, res) => {
  const params = UpdateAssetParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateAssetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid asset", issues: body.error.issues });
    return;
  }
  const d = body.data as Record<string, unknown>;
  const asset = await getAsset(params.data.id);
  if (!asset) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await updateAsset(params.data.id, {
    seedName: String(d["seedName"]),
    batchNumber: String(d["batchNumber"]),
    quantity: Number(d["quantity"]),
    location: String(d["location"]),
    expiryDate: parseDate(d["expiryDate"]) ?? "",
    productionDate: parseDate(d["productionDate"]),
    supplier: d["supplier"] ? String(d["supplier"]) : undefined,
    category: d["category"] as import("../lib/store").SeedCategory | undefined,
    germinationRate: d["germinationRate"] != null ? Number(d["germinationRate"]) : undefined,
    pricePerUnit: d["pricePerUnit"] != null ? Number(d["pricePerUnit"]) : undefined,
  });
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(withStatus(updated));
});

router.delete("/assets/:id", async (req, res) => {
  const params = DeleteAssetParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const ok = await deleteAsset(params.data.id);
  if (!ok) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

export default router;
