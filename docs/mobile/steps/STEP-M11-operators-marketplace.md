# STEP-M11 — Operators Marketplace

**Status:** Pending
**Phase:** User & Commerce
**Dependencies:** STEP-M02 (auth for inquiry), STEP-M09 (plan results link to operators)

---

## Scope

Native operators marketplace. Users can browse vetted trek operators, view their profiles, and send an enquiry directly from the app. Mobile adds direct-contact shortcuts (call, WhatsApp) that the web cannot provide. Mirrors web `/operators` and `/operators/[slug]`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/browse/operators.tsx` | Operators listing screen |
| `apps/mobile/app/(tabs)/browse/operators/[slug].tsx` | Operator detail screen |
| `apps/mobile/components/operators/OperatorCard.tsx` | Operator card (name, region, rating, specialities) |
| `apps/mobile/components/operators/OperatorInquirySheet.tsx` | Inquiry form bottom sheet |
| `apps/mobile/components/operators/OperatorReviewsList.tsx` | Reviews section |
| `apps/mobile/hooks/useOperators.ts` | Fetch operators list + detail |

---

## Operators Listing Screen

```
[Search bar: "Search operators"]
[Region filter chips: All | Uttarakhand | Himachal | Kashmir | All India]
────────────────────────────────
[Operator Card]
  [Logo/Photo]  TrekSphere Adventures
  ⭐ 4.8  (23 reviews)
  Uttarakhand · Himachal Pradesh
  "Kedarkantha, Valley of Flowers, Rupin Pass"
  [Inquire →]
────────────────────────────────
```

- `GET /api/v1/public/operators?region=` — same endpoint as web
- Filter by state (same states as trek filter)

---

## Operator Detail Screen

```
[Cover photo — 220px hero]
[Logo + name overlay]
────────────────────────────────
[⭐ 4.8  23 reviews]  [📍 Rishikesh, Uttarakhand]
[Specialities: Winter treks, Group departures]
[Certified: Himalayan Mountaineering Institute]
────────────────────────────────
[About — description text]
────────────────────────────────
[Trek portfolio — horizontal scroll]
  [Kedarkantha] [Brahmatal] [Hampta Pass]
────────────────────────────────
[Reviews section — last 5]
────────────────────────────────
[Call operator] (if phone available — tel: link)
[WhatsApp]      (whatsapp://send?phone=)
[Send inquiry]  → opens OperatorInquirySheet
```

---

## Inquiry Sheet (Bottom Sheet)

```
"Send an enquiry to TrekSphere Adventures"
────────────────────────────────
Name *
Email *
Phone (optional)
Trek of interest  [Kedarkantha ▼]
Preferred dates   [date picker]
Group size        [1–20 selector]
Message           [free text, optional]
────────────────────────────────
[Send inquiry]
```

- `POST /api/v1/leads` with `lead_type: "operator_inquiry"`, `operator_id`
- Success state: "Enquiry sent! You'll hear back within 48 hours."
- Stores in `account/enquiries` (visible in Account tab)

---

## Native Contact Shortcuts

```typescript
// Direct call
Linking.openURL(`tel:${operator.phone}`);

// WhatsApp
const msg = encodeURIComponent(`Hi, I found you on TrekYatra and I'm interested in ${trekName}`);
Linking.openURL(`whatsapp://send?phone=${operator.whatsapp}&text=${msg}`);
```

Show these only when `operator.phone` / `operator.whatsapp` are available. WhatsApp deeplink falls back to `https://wa.me/{phone}` if WhatsApp not installed.

---

## Verification

1. **TC-M11-01**: Operators list loads with region filter chips
2. **TC-M11-02**: Filter by "Uttarakhand" → only Uttarakhand operators shown
3. **TC-M11-03**: Tap operator → detail screen with all sections
4. **TC-M11-04**: Tap "Send inquiry" → form sheet → submit → success state + appears in Enquiries
5. **TC-M11-05**: Tap "Call operator" → phone dialler opens (if phone available)
6. **TC-M11-06**: Tap "WhatsApp" → WhatsApp opens with pre-filled message
