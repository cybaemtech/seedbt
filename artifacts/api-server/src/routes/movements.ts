import { Router, type IRouter } from "express";
import { getAllMovements, createMovement, getAsset } from "../lib/store";
import type { StockMovementType } from "../lib/store";

const router: IRouter = Router();

router.get("/movements", async (req, res) => {
  const { assetId, movementType, fromDate, toDate } = req.query as Record<string, string | undefined>;
  const movements = await getAllMovements({
    assetId,
    movementType: movementType as StockMovementType | undefined,
    fromDate,
    toDate,
  });

  // Enrich with seedName and batchNumber
  const enriched = await Promise.all(
    movements.map(async (m) => {
      const asset = await getAsset(m.assetId);
      return {
        ...m,
        seedName: asset?.seedName ?? "Unknown",
        batchNumber: asset?.batchNumber ?? "—",
      };
    }),
  );

  res.json(enriched);
});

router.post("/movements", async (req, res) => {
  const { assetId, movementType, quantity, fromLocation, toLocation, date, notes } = req.body as {
    assetId?: string;
    movementType?: string;
    quantity?: number;
    fromLocation?: string;
    toLocation?: string;
    date?: string;
    notes?: string;
  };

  if (!assetId || !movementType || !quantity || !date) {
    res.status(400).json({ error: "assetId, movementType, quantity, and date are required" });
    return;
  }

  if (!["IN", "OUT", "TRANSFER"].includes(movementType)) {
    res.status(400).json({ error: "movementType must be IN, OUT, or TRANSFER" });
    return;
  }

  if (movementType === "TRANSFER" && !toLocation) {
    res.status(400).json({ error: "toLocation is required for TRANSFER movements" });
    return;
  }

  const result = await createMovement({
    assetId,
    movementType: movementType as StockMovementType,
    quantity: Number(quantity),
    fromLocation,
    toLocation,
    date,
    notes,
  });

  if (!result) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const { movement, asset } = result;
  res.status(201).json({
    ...movement,
    seedName: asset.seedName,
    batchNumber: asset.batchNumber,
  });
});

export default router;
