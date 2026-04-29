import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type AssetStatus = "Fresh" | "Expiring" | "Expired";
export type ExpiryPriority = "SellImmediately" | "Monitor" | "Safe";
export type MovementEventType = "Created" | "Stored" | "Dispatched" | "Delivered";
export type StockMovementType = "IN" | "OUT" | "TRANSFER";
export type SeedCategory = "Vegetable" | "Grain" | "Legume" | "Oilseed" | "Fiber" | "Spice" | "Fruit" | "Herb" | "Other";

export interface StoredAsset {
  id: string;
  seedName: string;
  batchNumber: string;
  quantity: number;
  location: string;
  expiryDate: string;
  createdAt: string;
  productionDate?: string;
  supplier?: string;
  category?: SeedCategory;
  germinationRate?: number;
  pricePerUnit?: number;
}

export interface StoredMovementEvent {
  id: string;
  assetId: string;
  type: MovementEventType;
  location: string;
  notes?: string;
  timestamp: string;
}

export interface StoredStockMovement {
  id: string;
  assetId: string;
  movementType: StockMovementType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface StoreShape {
  assets: StoredAsset[];
  history: Record<string, StoredMovementEvent[]>;
  movements: StoredStockMovement[];
  locations: string[];
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

function subtractDays(d: Date, days: number): Date {
  return addDays(d, -days);
}

function defaultSeed(): StoreShape {
  const today = new Date();

  const locations: string[] = [
    "Warehouse A",
    "Warehouse B",
    "Warehouse C",
    "Cold Storage 1",
    "Cold Storage 2",
    "Dealer Hub North",
    "Dealer Hub South",
    "Processing Unit",
  ];

  const assets: StoredAsset[] = [
    {
      id: randomUUID(),
      seedName: "Hybrid Chilli KS-401",
      batchNumber: "CHL-2026-A12",
      quantity: 320,
      location: "Warehouse A",
      expiryDate: isoDate(addDays(today, 220)),
      createdAt: subtractDays(today, 45).toISOString(),
      productionDate: isoDate(subtractDays(today, 60)),
      supplier: "Kaveri Seeds Ltd",
      category: "Vegetable",
      germinationRate: 92,
      pricePerUnit: 18.5,
    },
    {
      id: randomUUID(),
      seedName: "Wheat HD-2967",
      batchNumber: "WHT-2026-B07",
      quantity: 42,
      location: "Warehouse B",
      expiryDate: isoDate(addDays(today, 18)),
      createdAt: subtractDays(today, 80).toISOString(),
      productionDate: isoDate(subtractDays(today, 95)),
      supplier: "National Seeds Corp",
      category: "Grain",
      germinationRate: 78,
      pricePerUnit: 6.0,
    },
    {
      id: randomUUID(),
      seedName: "Maize NK-30",
      batchNumber: "MZE-2026-C04",
      quantity: 580,
      location: "Cold Storage 2",
      expiryDate: isoDate(addDays(today, 410)),
      createdAt: subtractDays(today, 30).toISOString(),
      productionDate: isoDate(subtractDays(today, 50)),
      supplier: "Syngenta India",
      category: "Grain",
      germinationRate: 96,
      pricePerUnit: 22.0,
    },
    {
      id: randomUUID(),
      seedName: "Paddy MTU-1010",
      batchNumber: "PDY-2025-K22",
      quantity: 18,
      location: "Warehouse A",
      expiryDate: isoDate(addDays(today, -12)),
      createdAt: subtractDays(today, 120).toISOString(),
      productionDate: isoDate(subtractDays(today, 140)),
      supplier: "TNAU Agri Seeds",
      category: "Grain",
      germinationRate: 61,
      pricePerUnit: 8.5,
    },
    {
      id: randomUUID(),
      seedName: "Cotton Bt-RCH-659",
      batchNumber: "CTN-2026-D19",
      quantity: 125,
      location: "Warehouse C",
      expiryDate: isoDate(addDays(today, 95)),
      createdAt: subtractDays(today, 20).toISOString(),
      productionDate: isoDate(subtractDays(today, 40)),
      supplier: "Rasi Seeds Pvt Ltd",
      category: "Fiber",
      germinationRate: 88,
      pricePerUnit: 35.0,
    },
    {
      id: randomUUID(),
      seedName: "Tomato Arka Rakshak",
      batchNumber: "TMT-2026-E03",
      quantity: 240,
      location: "Cold Storage 1",
      expiryDate: isoDate(addDays(today, 26)),
      createdAt: subtractDays(today, 10).toISOString(),
      productionDate: isoDate(subtractDays(today, 25)),
      supplier: "IIHR Bangalore",
      category: "Vegetable",
      germinationRate: 91,
      pricePerUnit: 55.0,
    },
    {
      id: randomUUID(),
      seedName: "Soybean JS-335",
      batchNumber: "SBN-2026-F08",
      quantity: 410,
      location: "Warehouse B",
      expiryDate: isoDate(addDays(today, 540)),
      createdAt: subtractDays(today, 15).toISOString(),
      productionDate: isoDate(subtractDays(today, 30)),
      supplier: "Mahyco Seeds",
      category: "Legume",
      germinationRate: 94,
      pricePerUnit: 12.0,
    },
    {
      id: randomUUID(),
      seedName: "Onion N-53",
      batchNumber: "ONI-2025-G14",
      quantity: 32,
      location: "Warehouse A",
      expiryDate: isoDate(addDays(today, 7)),
      createdAt: subtractDays(today, 90).toISOString(),
      productionDate: isoDate(subtractDays(today, 110)),
      supplier: "Indo-American Seeds",
      category: "Vegetable",
      germinationRate: 73,
      pricePerUnit: 42.0,
    },
    {
      id: randomUUID(),
      seedName: "Sunflower KBSH-44",
      batchNumber: "SFL-2026-H01",
      quantity: 195,
      location: "Cold Storage 1",
      expiryDate: isoDate(addDays(today, 180)),
      createdAt: subtractDays(today, 25).toISOString(),
      productionDate: isoDate(subtractDays(today, 45)),
      supplier: "Karnataka State Seeds Corp",
      category: "Oilseed",
      germinationRate: 87,
      pricePerUnit: 28.0,
    },
    {
      id: randomUUID(),
      seedName: "Coriander RCr-41",
      batchNumber: "COR-2026-I06",
      quantity: 85,
      location: "Warehouse C",
      expiryDate: isoDate(addDays(today, 300)),
      createdAt: subtractDays(today, 5).toISOString(),
      productionDate: isoDate(subtractDays(today, 20)),
      supplier: "Rajasthan Seeds Ltd",
      category: "Spice",
      germinationRate: 83,
      pricePerUnit: 15.0,
    },
    {
      id: randomUUID(),
      seedName: "Groundnut TAG-24",
      batchNumber: "GND-2026-J03",
      quantity: 270,
      location: "Warehouse B",
      expiryDate: isoDate(addDays(today, 450)),
      createdAt: subtractDays(today, 12).toISOString(),
      productionDate: isoDate(subtractDays(today, 30)),
      supplier: "ICRISAT Seeds",
      category: "Oilseed",
      germinationRate: 95,
      pricePerUnit: 9.5,
    },
    {
      id: randomUUID(),
      seedName: "Bitter Gourd Priya",
      batchNumber: "BTG-2026-K11",
      quantity: 60,
      location: "Cold Storage 2",
      expiryDate: isoDate(addDays(today, 22)),
      createdAt: subtractDays(today, 8).toISOString(),
      productionDate: isoDate(subtractDays(today, 22)),
      supplier: "East-West Seeds",
      category: "Vegetable",
      germinationRate: 89,
      pricePerUnit: 48.0,
    },
  ];

  const history: Record<string, StoredMovementEvent[]> = {};
  for (const asset of assets) {
    history[asset.id] = [
      {
        id: randomUUID(),
        assetId: asset.id,
        type: "Created",
        location: asset.location,
        notes: `Batch ${asset.batchNumber} registered into the system.`,
        timestamp: asset.createdAt,
      },
      {
        id: randomUUID(),
        assetId: asset.id,
        type: "Stored",
        location: asset.location,
        notes: "Quality check passed and moved to storage.",
        timestamp: new Date(new Date(asset.createdAt).getTime() + 3600000).toISOString(),
      },
    ];
  }

  // Add some dispatched/delivered events for richness
  const maize = assets[2]!;
  const soybean = assets[6]!;
  const cotton = assets[4]!;

  history[maize.id]!.push({
    id: randomUUID(),
    assetId: maize.id,
    type: "Dispatched",
    location: "Vehicle TN-09-AB-4521",
    notes: "Outbound to Coimbatore distribution hub.",
    timestamp: addDays(new Date(maize.createdAt), 5).toISOString(),
  });

  history[soybean.id]!.push({
    id: randomUUID(),
    assetId: soybean.id,
    type: "Dispatched",
    location: "Vehicle MH-12-XY-9087",
    notes: "Outbound to regional dealer network.",
    timestamp: addDays(new Date(soybean.createdAt), 3).toISOString(),
  });
  history[soybean.id]!.push({
    id: randomUUID(),
    assetId: soybean.id,
    type: "Delivered",
    location: "Dealer Hub South",
    notes: "Signed for by R. Kulkarni.",
    timestamp: addDays(new Date(soybean.createdAt), 6).toISOString(),
  });

  history[cotton.id]!.push({
    id: randomUUID(),
    assetId: cotton.id,
    type: "Stored",
    location: "Warehouse C",
    notes: "Re-verified batch quality after supplier audit.",
    timestamp: addDays(new Date(cotton.createdAt), 4).toISOString(),
  });

  // Stock movements - realistic sample data
  const movements: StoredStockMovement[] = [];

  const movAssets = [maize, soybean, cotton, assets[0]!, assets[5]!, assets[8]!, assets[10]!];
  const movTypes: StockMovementType[] = ["IN", "OUT", "IN", "OUT", "TRANSFER", "IN", "OUT"];
  const movQtys = [100, 50, 200, 80, 150, 75, 120];
  const movDays = [-40, -35, -30, -25, -20, -15, -10];
  const movFromLoc = [undefined, "Warehouse B", undefined, "Warehouse A", "Cold Storage 1", undefined, "Warehouse B"];
  const movToLoc = ["Cold Storage 2", undefined, "Warehouse B", undefined, "Cold Storage 2", "Warehouse B", undefined];
  const movNotes = [
    "Received from Syngenta India warehouse.",
    "Dispatched to Coimbatore dealer.",
    "Inbound from Mahyco distribution center.",
    "Sold to Punjab retailer — batch partially fulfilled.",
    "Moved to cold storage for extended shelf life.",
    "Received from Karnataka State Seeds Corp.",
    "Outbound to dealer network — quarterly supply.",
  ];

  for (let i = 0; i < movAssets.length; i++) {
    movements.push({
      id: randomUUID(),
      assetId: movAssets[i]!.id,
      movementType: movTypes[i]!,
      quantity: movQtys[i]!,
      fromLocation: movFromLoc[i],
      toLocation: movToLoc[i],
      date: isoDate(addDays(today, movDays[i]!)),
      notes: movNotes[i],
      createdAt: addDays(today, movDays[i]!).toISOString(),
    });
  }

  return { assets, history, movements, locations };
}

async function ensureLoaded(): Promise<StoreShape> {
  if (inMemory) return inMemory;

  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    if (!parsed.assets || !parsed.history) throw new Error("Invalid store shape");
    // Migrate older stores that lack movements/locations
    if (!parsed.movements) parsed.movements = [];
    if (!parsed.locations) {
      parsed.locations = [
        "Warehouse A", "Warehouse B", "Warehouse C",
        "Cold Storage 1", "Cold Storage 2",
        "Dealer Hub North", "Dealer Hub South", "Processing Unit",
      ];
    }
    inMemory = parsed as StoreShape;
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
  writeQueue = writeQueue.then(persistNow).catch(() => {});
}

// ---------- ASSETS ----------

export async function getAllAssets(): Promise<StoredAsset[]> {
  const store = await ensureLoaded();
  return [...store.assets].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getAsset(id: string): Promise<StoredAsset | null> {
  const store = await ensureLoaded();
  return store.assets.find((a) => a.id === id) ?? null;
}

export async function createAsset(input: Omit<StoredAsset, "id" | "createdAt">): Promise<StoredAsset> {
  const store = await ensureLoaded();
  const asset: StoredAsset = { id: randomUUID(), createdAt: nowIso(), ...input };
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
  input: Omit<StoredAsset, "id" | "createdAt">,
): Promise<StoredAsset | null> {
  const store = await ensureLoaded();
  const idx = store.assets.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const existing = store.assets[idx]!;
  const updated: StoredAsset = { ...existing, ...input };
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
  // also remove movements for this asset
  store.movements = store.movements.filter((m) => m.assetId !== id);
  persist();
  return true;
}

// ---------- HISTORY ----------

export async function getHistory(assetId: string): Promise<StoredMovementEvent[]> {
  const store = await ensureLoaded();
  const events = store.history[assetId] ?? [];
  return [...events].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
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

// ---------- STOCK MOVEMENTS ----------

export async function getAllMovements(filters?: {
  assetId?: string;
  movementType?: StockMovementType;
  fromDate?: string;
  toDate?: string;
}): Promise<StoredStockMovement[]> {
  const store = await ensureLoaded();
  let results = [...store.movements];
  if (filters?.assetId) results = results.filter((m) => m.assetId === filters.assetId);
  if (filters?.movementType) results = results.filter((m) => m.movementType === filters.movementType);
  if (filters?.fromDate) results = results.filter((m) => m.date >= filters.fromDate!);
  if (filters?.toDate) results = results.filter((m) => m.date <= filters.toDate!);
  return results.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function createMovement(input: {
  assetId: string;
  movementType: StockMovementType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  date: string;
  notes?: string;
}): Promise<{ movement: StoredStockMovement; asset: StoredAsset } | null> {
  const store = await ensureLoaded();
  const asset = store.assets.find((a) => a.id === input.assetId);
  if (!asset) return null;

  const movement: StoredStockMovement = {
    id: randomUUID(),
    assetId: input.assetId,
    movementType: input.movementType,
    quantity: input.quantity,
    fromLocation: input.fromLocation,
    toLocation: input.toLocation,
    date: input.date,
    notes: input.notes,
    createdAt: nowIso(),
  };

  // Update asset quantity and location
  const idx = store.assets.findIndex((a) => a.id === input.assetId);
  if (input.movementType === "IN") {
    store.assets[idx]!.quantity += input.quantity;
    if (input.toLocation) store.assets[idx]!.location = input.toLocation;
  } else if (input.movementType === "OUT") {
    store.assets[idx]!.quantity = Math.max(0, store.assets[idx]!.quantity - input.quantity);
    if (input.fromLocation) store.assets[idx]!.location = input.fromLocation;
  } else if (input.movementType === "TRANSFER") {
    if (input.toLocation) store.assets[idx]!.location = input.toLocation;
  }

  store.movements.push(movement);
  persist();
  return { movement, asset: store.assets[idx]! };
}

// ---------- LOCATIONS ----------

export async function getLocations(): Promise<string[]> {
  const store = await ensureLoaded();
  return [...store.locations].sort();
}

export async function addLocation(name: string): Promise<string[]> {
  const store = await ensureLoaded();
  if (!store.locations.includes(name)) {
    store.locations.push(name);
    persist();
  }
  return [...store.locations].sort();
}

export async function removeLocation(name: string): Promise<boolean> {
  const store = await ensureLoaded();
  const idx = store.locations.indexOf(name);
  if (idx === -1) return false;
  store.locations.splice(idx, 1);
  persist();
  return true;
}
