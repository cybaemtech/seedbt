import type { AssetStatus, ExpiryPriority, StoredAsset } from "./store";

export const EXPIRING_WINDOW_DAYS = 30;
export const LOW_STOCK_THRESHOLD = 50;

export function computeDaysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + "T00:00:00");
  const diffMs = expiry.getTime() - today.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function computeStatus(expiryDate: string): AssetStatus {
  const days = computeDaysRemaining(expiryDate);
  if (days < 0) return "Expired";
  if (days <= EXPIRING_WINDOW_DAYS) return "Expiring";
  return "Fresh";
}

export function computeExpiryPriority(expiryDate: string): ExpiryPriority {
  const days = computeDaysRemaining(expiryDate);
  if (days < 15) return "SellImmediately";
  if (days <= 30) return "Monitor";
  return "Safe";
}

export interface AssetWithStatus extends StoredAsset {
  status: AssetStatus;
  daysRemaining: number;
  expiryPriority: ExpiryPriority;
  totalValue: number;
}

export function withStatus(asset: StoredAsset): AssetWithStatus {
  const daysRemaining = computeDaysRemaining(asset.expiryDate);
  const status = computeStatus(asset.expiryDate);
  const expiryPriority = computeExpiryPriority(asset.expiryDate);
  const totalValue = asset.quantity * (asset.pricePerUnit ?? 0);
  return { ...asset, status, daysRemaining, expiryPriority, totalValue };
}

export function withStatusAll(assets: StoredAsset[]): AssetWithStatus[] {
  return assets.map(withStatus);
}
