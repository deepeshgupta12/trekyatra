import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/mobileApi";
import {
  initIAP,
  closeIAP,
  fetchSubscriptionProducts,
  purchaseSubscription,
  getRestoredPurchases,
  acknowledgePurchase,
  getReceiptData,
  purchaseUpdatedListener,
  purchaseErrorListener,
  IAP_PRODUCT_IDS,
  type IAPProductId,
  type IAPProduct,
  type Purchase,
} from "@/services/iapService";

export type PremiumPurchaseStatus =
  | "idle"
  | "initializing"
  | "ready"
  | "purchasing"
  | "verifying"
  | "restoring"
  | "done"
  | "error";

export function usePremium() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PremiumPurchaseStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const iapReady = useRef(false);

  const { data: subStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["subscriptionStatus"],
    queryFn: () => subscriptionApi.getStatus(),
    retry: 1,
  });

  const isPremium = subStatus?.plan === "premium";

  useEffect(() => {
    let purchaseListener: ReturnType<typeof purchaseUpdatedListener> | null = null;
    let errorListener: ReturnType<typeof purchaseErrorListener> | null = null;

    async function setup() {
      setStatus("initializing");
      const connected = await initIAP();
      if (!connected) {
        setStatus("ready");
        return;
      }
      iapReady.current = true;

      purchaseListener = purchaseUpdatedListener(async (purchase: Purchase) => {
        setStatus("verifying");
        try {
          const receiptData = await getReceiptData(purchase);
          const result = await subscriptionApi.verifyIAP({
            platform: Platform.OS as "ios" | "android",
            receipt_data: receiptData,
            product_id: purchase.productId,
            transaction_id: purchase.transactionId ?? undefined,
          });
          await acknowledgePurchase(purchase);
          if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
            setStatus("done");
          } else {
            setErrorMessage(result.message);
            setStatus("error");
          }
        } catch (e: unknown) {
          setErrorMessage(e instanceof Error ? e.message : "Verification failed.");
          setStatus("error");
        }
      });

      errorListener = purchaseErrorListener((err: { code?: string; message?: string }) => {
        if (err.code !== "E_USER_CANCELLED") {
          setErrorMessage(err.message ?? "Purchase failed.");
          setStatus("error");
        } else {
          setStatus("ready");
        }
      });

      const subs = await fetchSubscriptionProducts();
      setProducts(subs);
      setStatus("ready");
    }

    setup();
    return () => {
      purchaseListener?.remove();
      errorListener?.remove();
      if (iapReady.current) closeIAP();
    };
  }, [queryClient]);

  const subscribe = useCallback(
    async (productId: IAPProductId = IAP_PRODUCT_IDS.monthly) => {
      if (status === "purchasing" || status === "verifying") return;
      setStatus("purchasing");
      setErrorMessage(null);
      if (!iapReady.current) {
        // Test mode: call backend directly (no store credentials configured)
        try {
          const result = await subscriptionApi.verifyIAP({
            platform: Platform.OS as "ios" | "android",
            receipt_data: "test_receipt_no_iap_credentials",
            product_id: productId,
          });
          if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
            setStatus("done");
          } else {
            setErrorMessage(result.message);
            setStatus("error");
          }
        } catch {
          setErrorMessage("Could not connect to server.");
          setStatus("error");
        }
        return;
      }
      try {
        await purchaseSubscription(productId);
        // purchaseUpdatedListener handles success/error
      } catch (e: unknown) {
        if ((e as { code?: string }).code !== "E_USER_CANCELLED") {
          setErrorMessage(e instanceof Error ? e.message : "Purchase failed.");
          setStatus("error");
        } else {
          setStatus("ready");
        }
      }
    },
    [status, queryClient]
  );

  const restore = useCallback(async () => {
    if (status === "restoring") return;
    setStatus("restoring");
    setErrorMessage(null);
    try {
      const purchases = await getRestoredPurchases();
      if (purchases.length === 0) {
        const result = await subscriptionApi.restoreIAP(
          Platform.OS as "ios" | "android",
          "restore_no_purchases"
        );
        if (result.restored) {
          queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
          setStatus("done");
        } else {
          setErrorMessage("No active subscription found to restore.");
          setStatus("ready");
        }
        return;
      }
      const latest = purchases[0];
      const receiptData = await getReceiptData(latest);
      const result = await subscriptionApi.restoreIAP(
        Platform.OS as "ios" | "android",
        receiptData
      );
      if (result.restored) {
        queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
        setStatus("done");
      } else {
        setErrorMessage(result.message);
        setStatus("ready");
      }
    } catch {
      setErrorMessage("Restore failed. Please try again.");
      setStatus("error");
    }
  }, [status, queryClient]);

  const reset = useCallback(() => {
    setStatus("ready");
    setErrorMessage(null);
  }, []);

  return {
    isPremium,
    isLoadingStatus,
    status,
    errorMessage,
    products,
    subscribe,
    restore,
    reset,
  };
}
