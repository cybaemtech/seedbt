import { Router, type IRouter } from "express";
import { getLocations, addLocation, removeLocation } from "../lib/store";

const router: IRouter = Router();

router.get("/locations", async (_req, res) => {
  const locations = await getLocations();
  res.json(locations);
});

router.post("/locations", async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const locations = await addLocation(name.trim());
  res.status(201).json(locations);
});

router.delete("/locations/:name", async (req, res) => {
  const name = decodeURIComponent(req.params["name"] ?? "");
  const ok = await removeLocation(name);
  if (!ok) { res.status(404).json({ error: "Location not found" }); return; }
  res.status(204).end();
});

export default router;
