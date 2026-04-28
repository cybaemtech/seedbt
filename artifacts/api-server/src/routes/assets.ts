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
  const created = await createAsset({
    seedName: parsed.data.seedName,
    batchNumber: parsed.data.batchNumber,
    quantity: parsed.data.quantity,
    location: parsed.data.location,
    expiryDate:
      parsed.data.expiryDate instanceof Date
        ? parsed.data.expiryDate.toISOString().slice(0, 10)
        : String(parsed.data.expiryDate),
  });
  res.status(201).json(withStatus(created));
});

router.get("/assets/:id", async (req, res) => {
  const params = GetAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const asset = await getAsset(params.data.id);
  if (!asset) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(withStatus(asset));
});

router.put("/assets/:id", async (req, res) => {
  const params = UpdateAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = UpdateAssetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid asset", issues: body.error.issues });
    return;
  }
  const updated = await updateAsset(params.data.id, {
    seedName: body.data.seedName,
    batchNumber: body.data.batchNumber,
    quantity: body.data.quantity,
    location: body.data.location,
    expiryDate:
      body.data.expiryDate instanceof Date
        ? body.data.expiryDate.toISOString().slice(0, 10)
        : String(body.data.expiryDate),
  });
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(withStatus(updated));
});

router.delete("/assets/:id", async (req, res) => {
  const params = DeleteAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const ok = await deleteAsset(params.data.id);
  if (!ok) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

export default router;
