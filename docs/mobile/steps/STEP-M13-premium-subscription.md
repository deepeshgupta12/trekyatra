# STEP-M13 — Premium Subscription

**Status:** Pending
**Phase:** User & Commerce
**Dependencies:** STEP-M02 (auth), STEP-M10 (premium status in account)

---

## Scope

In-app purchase subscription for premium content access. Apple and Google require IAP for subscription purchases made inside their apps. A web-payment fallback (Stripe) is provided for users who prefer to subscribe via browser. Content gating mirrors the web premium system.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/account/premium.tsx` | Premium screen: features + pricing + subscribe |
| `apps/mobile/components/premium/PremiumFeatureList.tsx` | Feature comparison: free vs premium |
| `apps/mobile/components/premium/SubscribeButton.tsx` | Platform-aware IAP button |
| `apps/mobile/components/premium/GatedContentOverlay.tsx` | Blur overlay on locked sections |
| `apps/mobile/hooks/usePremium.ts` | IAP purchase + restore + status check |
| `apps/mobile/services/iapService.ts` | expo-in-app-purchases wrapper |

---

## Premium Screen

```
[Hero: "TrekYatra Premium"]
[Subtitle: "Everything you need for confident trekking"]
──────────────────────────────────────
[Feature comparison table]
                      Free    Premium
Trek guide access      ✓        ✓
Offline downloads      3        ∞
Comparison saves       1        ∞
Detailed permit guides  —       ✓
Full cost breakdowns    —       ✓
Priority plan results   —       ✓
Ad-free experience      —       ✓
──────────────────────────────────────
[₹299/month]    [₹2,499/year (save 30%)]
(two plan cards — tap to select)
──────────────────────────────────────
[Subscribe with Apple Pay / Google Pay]
[Restore purchase]
[Subscribe via website instead →]
──────────────────────────────────────
[Current subscribers: "You're Premium ✓"]
```

---

## IAP Product IDs

| Platform | Product ID | Type |
|----------|-----------|------|
| iOS (App Store) | `com.trekyatra.app.premium.monthly` | Auto-renewable subscription |
| iOS (App Store) | `com.trekyatra.app.premium.annual` | Auto-renewable subscription |
| Android (Play) | `trekyatra_premium_monthly` | Auto-renewable subscription |
| Android (Play) | `trekyatra_premium_annual` | Auto-renewable subscription |

---

## IAP Purchase Flow

```typescript
// services/iapService.ts
import * as InAppPurchases from 'expo-in-app-purchases';

async function purchasePremium(productId: string) {
  await InAppPurchases.connectAsync();

  // Listen for purchase updates
  InAppPurchases.setPurchaseListener(async ({ responseCode, results }) => {
    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      for (const purchase of results) {
        if (!purchase.acknowledged) {
          // Verify receipt on backend
          await api.post('/payments/iap/verify', {
            platform: Platform.OS,
            product_id: purchase.productId,
            purchase_token: purchase.purchaseToken,  // Android
            receipt_data: purchase.transactionReceipt, // iOS
          });
          // Acknowledge purchase
          await InAppPurchases.finishTransactionAsync(purchase, false);
        }
      }
    }
  });

  await InAppPurchases.purchaseItemAsync(productId);
}
```

---

## Backend Receipt Verification

`POST /api/v1/payments/iap/verify`:
- **iOS**: Send `receipt_data` to Apple's StoreKit validation endpoint
- **Android**: Use Google Play Developer API to verify `purchase_token`
- On success: set `user.premium_tier = 'premium'`, `premium_expires_at`

---

## Content Gating

```tsx
// components/premium/GatedContentOverlay.tsx
function GatedContentOverlay({ children, isLocked }: { children: ReactNode; isLocked: boolean }) {
  if (!isLocked) return <>{children}</>;
  return (
    <View>
      <BlurView intensity={40} style={StyleSheet.absoluteFill} />
      <View style={styles.lockBadge}>
        <Text>🔒 Premium content</Text>
        <Pressable onPress={() => router.push('/account/premium')}>
          <Text>Unlock with Premium →</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}
```

Applied to: detailed permit guides, full cost breakdowns, and premium trek comparison attributes.

---

## Restore Purchases

```typescript
async function restorePurchases() {
  await InAppPurchases.connectAsync();
  const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
  if (results?.length) {
    // Verify most recent active subscription
    await api.post('/payments/iap/restore', { purchases: results });
  }
}
```

Required by App Store guidelines — "Restore purchase" button must be visible.

---

## Web Fallback

For users who prefer not to use IAP (e.g., web users):
- "Subscribe via website instead →" opens `https://trekyatra.co.in/premium` in system browser
- Stripe subscription on web updates `user.premium_tier` in backend
- Next time user opens app and `GET /auth/me` is called, premium status is synced

---

## Verification

1. **TC-M13-01**: Premium screen shows feature comparison + pricing plans
2. **TC-M13-02**: Select monthly plan → IAP purchase sheet opens (sandbox/test mode)
3. **TC-M13-03**: Complete sandbox purchase → premium status synced to backend → premium badge in account
4. **TC-M13-04**: Gated content shows blur overlay for free users → "Unlock" navigates to premium screen
5. **TC-M13-05**: Gated content visible for premium users (no overlay)
6. **TC-M13-06**: Restore purchase → existing subscription recognised
7. **TC-M13-07**: "Subscribe via website" → opens trekyatra.co.in/premium in browser

---

## Notes

- Apple takes 30% of IAP revenue in year 1, 15% from year 2 onwards for subscriptions
- Google takes 30% (15% after first year). Factor this into pricing — ₹299/month on mobile vs ₹249/month on web is acceptable
- App Store Connect requires all in-app purchase products to be configured and approved before submission
- Use `expo-in-app-purchases` in development mode with test accounts (iOS Sandbox / Android test billing)
