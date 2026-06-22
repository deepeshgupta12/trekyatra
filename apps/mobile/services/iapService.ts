import { Platform } from "react-native";

// IAP native module stub.
// react-native-iap v15 requires New Architecture (NitroModules) which is not yet enabled.
// Full native IAP purchase sheet will be wired at M22 (EAS Build + App Store Connect products).
// Until then: initIAP() returns false → usePremium falls back to test-mode backend call.

export const IAP_PRODUCT_IDS = {
  monthly: Platform.OS === "ios"
    ? "com.trekyatra.premium.monthly"
    : "com.trekyatra.premium.monthly",
  annual: Platform.OS === "ios"
    ? "com.trekyatra.premium.annual"
    : "com.trekyatra.premium.annual",
} as const;

export type IAPProductId = (typeof IAP_PRODUCT_IDS)[keyof typeof IAP_PRODUCT_IDS];

export interface IAPProduct {
  productId: string;
  localizedPrice?: string;
  title?: string;
  description?: string;
  interval: "monthly" | "annual";
}

export interface Purchase {
  productId: string;
  transactionId?: string;
}

export interface PurchaseError {
  code?: string;
  message?: string;
}

export interface EventSubscription {
  remove: () => void;
}

export async function initIAP(): Promise<boolean> {
  return false;
}

export async function closeIAP(): Promise<void> {}

export async function fetchSubscriptionProducts(): Promise<IAPProduct[]> {
  return Object.values(IAP_PRODUCT_IDS).map((sku) => ({
    productId: sku,
    interval: sku.includes("annual") ? "annual" : "monthly",
  }));
}

export async function purchaseSubscription(_productId: IAPProductId): Promise<void> {
  throw new Error("IAP not available — use test mode backend path.");
}

export async function getRestoredPurchases(): Promise<Purchase[]> {
  return [];
}

export async function acknowledgePurchase(_purchase: Purchase): Promise<void> {}

export async function getReceiptData(_purchase: Purchase): Promise<string> {
  return _purchase.transactionId ?? "stub_receipt";
}

export function purchaseUpdatedListener(
  _listener: (purchase: Purchase) => void
): EventSubscription {
  return { remove: () => {} };
}

export function purchaseErrorListener(
  _listener: (error: PurchaseError) => void
): EventSubscription {
  return { remove: () => {} };
}
