import { Router, type IRouter } from "express";
import {
  CreateAssetHistoryBody,
  CreateAssetHistoryParams,
  ListAssetHistoryParams,
} from "@workspace/api-zod";
import { appendHistory, getAsset, getHistory } from "../lib/store";

const router: IRouter = Router();

router.get("/assets/:id/history", async (req, res) => {
  const params = ListAssetHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const asset = await getAsset(params.data.id);
  if (!asset) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const events = await getHistory(params.data.id);
  res.json(events);
});

router.post("/assets/:id/history", async (req, res) => {
  const params = CreateAssetHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = CreateAssetHistoryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid event", issues: body.error.issues });
    return;
  }
  const event = await appendHistory(params.data.id, {
    type: body.data.type,
    location: body.data.location,
    notes: body.data.notes,
  });
  if (!event) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(201).json(event);
});

export default router;
