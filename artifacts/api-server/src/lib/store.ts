import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type AssetStatus = "Fresh" | "Expiring" | "Expired";
export type MovementEventType =
  | "Created"
  | "Stored"
  | "Dispatched"
  | "Delivered";

export interface StoredAsset {
  id: string;
  seedName: string;
  batchNumber: string;
  quantity: number;
  location: string;
  expiryDate: string; // ISO date (YYYY-MM-DD)
  createdAt: string; // ISO datetime
}

export interface StoredMovementEvent {
  id: string;
  assetId: string;
  type: MovementEventType;
  location: string;
  notes?: string;
  timestamp: string; // ISO datetime
}

export interface StoreShape {
  assets: StoredAsset[];
  history: Record<string, StoredMovementEvent[]>;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "seedtrack.json");

let inMemory: StoreShape | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function nowIso(): string {
  return new Date().toISOString();
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function defaultSeed(): StoreShape {
  const today = new Date();
  const assets: StoredAsset[] = [
    {
      id: randomUUID(),
      seedName: "Hybrid Chilli KS-401",
      batchNumber: "CHL-2026-A12",
      quantity: 320,
      location: "Warehouse A — Shelf 3",
      expiryDate: isoDate(addDays(today, 220)),
      createdAt: nowIso(),
    },
    {
      id: randomUUID(),
      seedName: "Wheat HD-2967",
      batchNumber: "WHT-2026-B07",
      quantity: 42,
      location: "Warehouse B — Bin 11",
      expiryDate: isoDate(addDays(today, 18)),
      createdAt: nowIso(),
    },
    {
      id: randomUUID(),
      seedName: "Maize NK-30",
      batchNumber: "MZE-2026-C04",
      quantity: 580,
      location: "Cold Storage 2",
      expiryDate: isoDate(addDays(today, 410)),
      createdAt: nowIso(),
    },
    {
      id: randomUUID(),
      seedName: "Paddy MTU-1010",
      batchNumber: "PDY-2025-K22",
      quantity: 18,
      location: "Warehouse A — Shelf 7",
      expiryDate: isoDate(addDays(today, -12)),
      createdAt: nowIso(),
    },
    {
      id: randomUUID(),
      seedName: "Cotton Bt-RCH-659",
      batchNumber: "CTN-2026-D19",
      quantity: 125,
      location: "Warehouse C — Pallet 5",
      expiryDate: isoDate(addDays(today, 95)),
      createdAt: nowIso(),
    },
    {
      id: randomUUID(),
      seedName: "Tomato Arka Rakshak",
      batchNumber: "TMT-2026-E03",
      quantity: 240,
      location: "Cold Storage 1",
      expiryDate: isoDate(addDays(today, 26)),
      createdAt: nowIso(),
    },
    {
      id: randomUUID(),
      seedName: "Soybean JS-335",
      batchNumber: "SBN-2026-F08",
      quantity: 410,
      location: "Warehouse B — Bin 4",
      expiryDate: isoDate(addDays(today, 540)),
      createdAt: nowIso(),
    },
    {
      id: randomUUID(),
      seedName: "Onion N-53",
      batchNumber: "ONI-2025-G14",
      quantity: 32,
      location: "Warehouse A — Shelf 12",
      expiryDate: isoDate(addDays(today, 7)),
      createdAt: nowIso(),
    },
  ];

  const history: Record<string, StoredMovementEvent[]> = {};
  for (const asset of assets) {
    const created: StoredMovementEvent = {
      id: randomUUID(),
      assetId: asset.id,
      type: "Created",
      location: asset.location,
      notes: `Batch ${asset.batchNumber} registered into the system.`,
      timestamp: asset.createdAt,
    };
    const stored: StoredMovementEvent = {
      id: randomUUID(),
      assetId: asset.id,
      type: "Stored",
      location: asset.location,
      notes: "Quality check passed and moved to storage.",
      timestamp: nowIso(),
    };
    history[asset.id] = [created, stored];
  }

  // Add a couple of dispatched/delivered events for richer activity
  if (assets[2] && history[assets[2].id]) {
    history[assets[2].id].push({
      id: randomUUID(),
      assetId: assets[2].id,
      type: "Dispatched",
      location: "Vehicle TN-09-AB-4521",
      notes: "Outbound to Coimbatore distribution hub.",
      timestamp: nowIso(),
    });
  }
  if (assets[6] && history[assets[6].id]) {
    history[assets[6].id].push({
      id: randomUUID(),
      assetId: assets[6].id,
      type: "Dispatched",
      location: "Vehicle MH-12-XY-9087",
      notes: "Outbound to regional dealer network.",
      timestamp: nowIso(),
    });
    history[assets[6].id].push({
      id: randomUUID(),
      assetId: assets[6].id,
      type: "Delivered",
      location: "Pune Dealer Warehouse",
      notes: "Signed for by R. Kulkarni.",
      timestamp: nowIso(),
    });
  }

  return { assets, history };
}

async function ensureLoaded(): Promise<StoreShape> {
  if (inMemory) return inMemory;

  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed.assets || !parsed.history) {
      throw new Error("Invalid store shape");
    }
    inMemory = parsed;
    return inMemory;
  } catch {
    inMemory = defaultSeed();
    await persistNow();
    return inMemory;
  }
}

async function persistNow(): Promise<void> {
  if (!inMemory) return;
  const data = JSON.stringify(inMemory, null, 2);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, data, "utf8");
}

function persist(): void {
  writeQueue = writeQueue.then(persistNow).catch(() => {
    /* swallow — next write will retry */
  });
}

export async function getAllAssets(): Promise<StoredAsset[]> {
  const store = await ensureLoaded();
  return [...store.assets].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export async function getAsset(id: string): Promise<StoredAsset | null> {
  const store = await ensureLoaded();
  return store.assets.find((a) => a.id === id) ?? null;
}

export async function createAsset(input: {
  seedName: string;
  batchNumber: string;
  quantity: number;
  location: string;
  expiryDate: string;
}): Promise<StoredAsset> {
  const store = await ensureLoaded();
  const asset: StoredAsset = {
    id: randomUUID(),
    seedName: input.seedName,
    batchNumber: input.batchNumber,
    quantity: input.quantity,
    location: input.location,
    expiryDate: input.expiryDate,
    createdAt: nowIso(),
  };
  store.assets.push(asset);
  store.history[asset.id] = [
    {
      id: randomUUID(),
      assetId: asset.id,
      type: "Created",
      location: asset.location,
      notes: `Batch ${asset.batchNumber} registered into the system.`,
      timestamp: asset.createdAt,
    },
  ];
  persist();
  return asset;
}

export async function updateAsset(
  id: string,
  input: {
    seedName: string;
    batchNumber: string;
    quantity: number;
    location: string;
    expiryDate: string;
  },
): Promise<StoredAsset | null> {
  const store = await ensureLoaded();
  const idx = store.assets.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const existing = store.assets[idx]!;
  const updated: StoredAsset = {
    ...existing,
    seedName: input.seedName,
    batchNumber: input.batchNumber,
    quantity: input.quantity,
    location: input.location,
    expiryDate: input.expiryDate,
  };
  store.assets[idx] = updated;
  persist();
  return updated;
}

export async function deleteAsset(id: string): Promise<boolean> {
  const store = await ensureLoaded();
  const idx = store.assets.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  store.assets.splice(idx, 1);
  delete store.history[id];
  persist();
  return true;
}

export async function getHistory(
  assetId: string,
): Promise<StoredMovementEvent[]> {
  const store = await ensureLoaded();
  const events = store.history[assetId] ?? [];
  return [...events].sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : 1,
  );
}

export async function appendHistory(
  assetId: string,
  input: { type: MovementEventType; location: string; notes?: string },
): Promise<StoredMovementEvent | null> {
  const store = await ensureLoaded();
  const asset = store.assets.find((a) => a.id === assetId);
  if (!asset) return null;
  const event: StoredMovementEvent = {
    id: randomUUID(),
    assetId,
    type: input.type,
    location: input.location,
    notes: input.notes,
    timestamp: nowIso(),
  };
  if (!store.history[assetId]) store.history[assetId] = [];
  store.history[assetId]!.push(event);
  persist();
  return event;
}

export async function getAllHistoryFlattened(): Promise<StoredMovementEvent[]> {
  const store = await ensureLoaded();
  const all: StoredMovementEvent[] = [];
  for (const events of Object.values(store.history)) {
    all.push(...events);
  }
  return all.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}
