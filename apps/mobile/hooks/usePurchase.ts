import { useState } from "react";
import { Linking } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { checkoutApi, type Product } from "@/lib/mobileApi";

type PurchaseStatus =
  | "idle"
  | "creating_order"
  | "payment"
  | "verifying"
  | "done"
  | "error";

export function usePurchase() {
  const [status, setStatus] = useState<PurchaseStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function purchase(product: Product, userEmail: string, userName: string) {
    setStatus("creating_order");
    setError(null);

    try {
      // 1. Create backend order → get provider_order_id + razorpay key
      const order = await checkoutApi.createOrder(product.slug);

      // 2. Open Razorpay native payment sheet (requires EAS development build)
      setStatus("payment");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RazorpayCheckout = require("react-native-razorpay");
      const paymentData = await RazorpayCheckout.open({
        description: product.title,
        currency: "INR",
        key: order.key_id ?? process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(order.amount_inr * 100),
        order_id: order.provider_order_id,
        name: "TrekYatra",
        prefill: { email: userEmail, name: userName },
        theme: { color: "#E8702A" },
      });

      // 3. Verify payment on backend → get signed download URL
      setStatus("verifying");
      const verification = await checkoutApi.verifyPayment(
        order.order_id,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id,
        paymentData.razorpay_signature,
      );

      // 4. Open download URL in browser — saves to Files/Downloads via Safari
      await Linking.openURL(verification.download_url);

      // 5. Invalidate purchases cache so Downloads screen refreshes
      queryClient.invalidateQueries({ queryKey: ["purchased-products"] });

      setStatus("done");
    } catch (err: unknown) {
      // Razorpay SDK throws with a description field on user cancellation
      const rzpErr = err as { description?: string };
      if (rzpErr?.description === "Payment Cancelled") {
        setStatus("idle");
        return;
      }
      setError(err instanceof Error ? err.message : "Payment failed");
      setStatus("error");
    }
  }

  async function downloadExisting(downloadUrl: string) {
    setStatus("creating_order"); // reuse state as "loading"
    setError(null);
    try {
      await Linking.openURL(downloadUrl);
      setStatus("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setError(null);
  }

  return { status, error, purchase, downloadExisting, reset };
}
