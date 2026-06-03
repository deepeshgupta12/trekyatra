# STEP-M12 — Digital Products

**Status:** Pending
**Phase:** User & Commerce
**Dependencies:** STEP-M02 (auth), STEP-M10 (downloads in account)

---

## Scope

Native digital product catalog with Razorpay payment integration. Users can purchase downloadable products (packing checklists, itinerary templates, altitude prep guides) and access them from the Downloads screen. Mirrors web `/products` and `/products/[slug]`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/browse/products.tsx` | Product catalog screen |
| `apps/mobile/app/(tabs)/browse/products/[slug].tsx` | Product detail screen |
| `apps/mobile/components/products/ProductCard.tsx` | Product tile (name, type, price) |
| `apps/mobile/components/products/RazorpaySheet.tsx` | Razorpay payment bottom sheet |
| `apps/mobile/hooks/useProducts.ts` | Fetch products list + detail |
| `apps/mobile/hooks/usePurchase.ts` | Purchase flow + verification |

---

## Product Catalog Screen

```
[Page title: "Trek Planning Resources"]
─────────────────────────────────
[PDF · 24 pages]
The Complete Himalayan Packing Checklist
₹199  [Buy →]

[PDF · 12 pages]
First-Trek Prep — 4-Week Training Plan
₹149  [Buy →]

[Notion Template]
India Trekking Cost Calculator
₹99   [Buy →]
─────────────────────────────────
```

- `GET /api/v1/public/products` — same endpoint as web

---

## Product Detail Screen

```
[Product preview image]
[Product name — large]
[Type badge: PDF / Notion / Excel]
[Description]
[Preview pages — 3 thumbnail images]
[₹199]  [Buy & Download →]
```

---

## Razorpay Payment Flow

```typescript
import RazorpayCheckout from 'react-native-razorpay';

async function purchaseProduct(productId: string, price: number) {
  // 1. Create Razorpay order
  const { order_id } = await api.post('/payments/checkout', {
    product_id: productId,
    platform: 'mobile',
  });

  // 2. Open Razorpay payment sheet
  const options = {
    description: 'TrekYatra Digital Product',
    currency: 'INR',
    key: process.env.EXPO_PUBLIC_RAZORPAY_KEY,
    amount: price * 100,  // paise
    order_id,
    name: 'TrekYatra',
    prefill: {
      email: user.email,
      name:  user.full_name,
    },
    theme: { color: colors.accent },
  };

  const paymentData = await RazorpayCheckout.open(options);

  // 3. Verify payment on backend
  await api.post('/payments/verify', {
    razorpay_order_id: paymentData.razorpay_order_id,
    razorpay_payment_id: paymentData.razorpay_payment_id,
    razorpay_signature: paymentData.razorpay_signature,
  });

  // 4. Download product file
  await downloadProduct(productId);
}
```

---

## Download Delivery

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function downloadProduct(orderId: string) {
  const { url, filename } = await api.get(`/orders/${orderId}/download`);
  const dest = FileSystem.documentDirectory + filename;
  await FileSystem.downloadAsync(url, dest);
  // Offer to open with external app (PDF viewer, Notion, etc.)
  await Sharing.shareAsync(dest);
}
```

---

## Purchased Product State

- Products already purchased: "Download again" button (no payment required)
- Check against `GET /api/v1/orders` response on product detail screen
- Purchased products listed in Account → Downloads screen

---

## Verification

1. **TC-M12-01**: Product catalog loads with all products + prices
2. **TC-M12-02**: Tap product → detail screen with preview images
3. **TC-M12-03**: Purchase flow → Razorpay sheet opens → complete payment → file downloads
4. **TC-M12-04**: Already-purchased product shows "Download again" (no payment)
5. **TC-M12-05**: Download → file opens in PDF viewer / Notion / Files app
6. **TC-M12-06**: Purchased product appears in Account → Downloads
