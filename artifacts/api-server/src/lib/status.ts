import type { AssetStatus, StoredAsset } from "./store";

export const EXPIRING_WINDOW_DAYS = 30;
export const LOW_STOCK_THRESHOLD = 50;

export function computeStatus(expiryDate: string): AssetStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + "T00:00:00");
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Expired";
  if (diffDays <= EXPIRING_WINDOW_DAYS) return "Expiring";
  return "Fresh";
}

export interface AssetWithStatus extends StoredAsset {
  status: AssetStatus;
}

export function withStatus(asset: StoredAsset): AssetWithStatus {
  return { ...asset, status: computeStatus(asset.expiryDate) };
}

export function withStatusAll(assets: StoredAsset[]): AssetWithStatus[] {
  return assets.map(withStatus);
}
