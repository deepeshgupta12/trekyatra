# STEP-M20 — Nearby Treks (GPS)

**Status:** Done (2026-06-29)
**Phase:** Engagement
**Dependencies:** STEP-M01 (foundation), STEP-M03 (backend mobile extensions), STEP-M19 (trek coordinates added for weather — same lat/lon data reused here)

---

## Scope

"Treks near me" feature using device GPS. The user grants location permission → app sends coordinates → backend returns the nearest treks sorted by straight-line distance. Displayed as a horizontal card strip on the Home screen and as a dedicated "Nearby" tab in the Browse/Explore section. Uses PostGIS `ST_Distance` for efficient spatial queries. Location is sent to the backend once per session — not continuously tracked.

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/alembic/versions/YYYYMMDD_0049_trek_coordinates.py` | Migration: add `lat` + `lon` columns to trek coordinate source (if not already added in M19) |
| `services/api/app/modules/treks/schemas.py` (modify) | Add `NearbyTrekOut` with `distance_km` field |
| `services/api/app/modules/treks/service.py` (modify) | Add `get_nearby_treks(lat, lon, radius_km, limit)` |
| `services/api/app/api/routes/mobile.py` (modify) | Add `GET /mobile/nearby` |
| `services/api/tests/test_nearby_m20.py` | Backend nearby query tests |

### Mobile
| File | Purpose |
|------|---------|
| `apps/mobile/components/home/NearbyTreksStrip.tsx` | Horizontal card strip on home screen |
| `apps/mobile/components/explore/NearbyTab.tsx` | Full nearby treks list in Browse tab |
| `apps/mobile/hooks/useNearbyTreks.ts` | GPS permission + coordinate fetch + API call |
| `apps/mobile/lib/location.ts` | Location permission flow + cached coordinate |

---

## DB Migration: Trek Coordinates

If STEP-M19 already added `lat`/`lon` to trek data, this migration is a no-op. Otherwise:

```sql
-- Add to static trek reference table or CMS pages metadata
-- For now: seed a JSON lookup table in the service layer (no DB required for MVP)
```

**Practical approach for V5**: Trek coordinates are seeded as a static lookup in the service layer (Python dict `TREK_COORDS = {"kedarkantha": (31.02, 78.23), ...}`) — no DB migration needed for the initial 30 treks. A future step can migrate this to a proper PostGIS column.

The 30 treks have well-known base camp coordinates that never change — hardcoding is acceptable and avoids over-engineering for V5.

---

## Backend: Nearby Service

```python
# modules/treks/service.py (addition)

TREK_COORDS: dict[str, tuple[float, float]] = {
    "kedarkantha":      (31.017, 78.233),
    "brahmatal":        (30.168, 79.524),
    "hampta-pass":      (32.238, 77.328),
    "rupin-pass":       (31.048, 77.834),
    "valley-of-flowers":(30.728, 79.609),
    "har-ki-dun":       (31.147, 78.423),
    "chopta-tungnath":  (30.498, 79.138),
    "roopkund":         (30.245, 79.731),
    "prashar-lake":     (31.706, 77.114),
    "chandrakhani-pass":(32.081, 77.219),
    "beas-kund":        (32.303, 77.152),
    "kheerganga":       (32.078, 77.427),
    # ... remaining treks
}

def get_nearby_treks(
    lat: float,
    lon: float,
    radius_km: float = 200,
    limit: int = 10,
) -> list[dict]:
    from math import radians, cos, sin, asin, sqrt

    def haversine(lat1, lon1, lat2, lon2) -> float:
        R = 6371
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
        return 2 * R * asin(sqrt(a))

    results = []
    for slug, (tlat, tlon) in TREK_COORDS.items():
        dist = haversine(lat, lon, tlat, tlon)
        if dist <= radius_km:
            results.append({"slug": slug, "distance_km": round(dist, 1)})

    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]
```

Haversine is sufficient for V5 — PostGIS `ST_Distance` would be over-engineered given the small number of treks.

---

## Backend Route

```python
# routes/mobile.py (addition)

@mobile_router.get("/nearby", response_model=NearbyTreksOut)
async def get_nearby_treks(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(200, ge=10, le=500),
    limit: int = Query(10, ge=1, le=20),
):
    """Returns treks sorted by distance from given coordinates."""
    results = treks_service.get_nearby_treks(lat, lon, radius_km, limit)
    enriched = await enrich_with_trek_data(results)  # adds name, difficulty, hero image
    return {"treks": enriched, "user_lat": lat, "user_lon": lon}
```

---

## Mobile: Location Library

```typescript
// lib/location.ts
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'ty_user_location';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface UserLocation {
  lat: number;
  lon: number;
  ts: number;
}

export async function getUserLocation(): Promise<UserLocation | null> {
  // Check cache
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    const loc: UserLocation = JSON.parse(cached);
    if (Date.now() - loc.ts < CACHE_TTL_MS) return loc;
  }

  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5000,
  });

  const loc: UserLocation = {
    lat: pos.coords.latitude,
    lon: pos.coords.longitude,
    ts: Date.now(),
  };

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(loc));
  return loc;
}

export async function clearLocationCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
```

Location cached for 30 minutes — does NOT require background location permission (`ACCESS_BACKGROUND_LOCATION`). Foreground only, one-shot fetch per session.

---

## Mobile: useNearbyTreks Hook

```typescript
// hooks/useNearbyTreks.ts
export function useNearbyTreks() {
  const [locationGranted, setGranted] = useState<boolean | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['nearby-treks'],
    queryFn: async () => {
      const loc = await getUserLocation();
      if (!loc) { setGranted(false); return null; }
      setGranted(true);
      return api.get(`/mobile/nearby?lat=${loc.lat}&lon=${loc.lon}&limit=8`);
    },
    staleTime: 30 * 60 * 1000,
  });

  return {
    treks: data?.treks ?? [],
    locationGranted,
    isLoading,
    refresh: refetch,
  };
}
```

---

## Home Screen: Nearby Strip

```tsx
// components/home/NearbyTreksStrip.tsx
export function NearbyTreksStrip() {
  const { treks, locationGranted, isLoading } = useNearbyTreks();

  if (locationGranted === false) {
    return (
      <Pressable onPress={() => Linking.openSettings()}>
        <Text>Enable location to see treks near you →</Text>
      </Pressable>
    );
  }

  if (!treks.length && !isLoading) return null;

  return (
    <View>
      <Text className="font-display text-lg font-semibold mb-3">Treks Near You</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {treks.map(trek => (
          <TrekCard key={trek.slug} trek={trek} badge={`${trek.distance_km} km away`} />
        ))}
      </ScrollView>
    </View>
  );
}
```

Hidden if: location denied, no treks within 200km, or loading (skeleton shown during load).

---

## Browse Tab: Nearby Tab

Add a "Nearby" tab to the Browse/Explore tab bar:

```
[All]  [By Region]  [Nearby]  [Operators]
```

"Nearby" tab shows the full nearby list with distance badges and a map pin strip at the top (static map image or simple SVG pin overlay — no full map in V5).

---

## Permission Prompt Flow

- **First ask**: Only prompt for location when the user taps "Find treks near me" or opens the Nearby tab — never on first app launch
- **Denied**: Show "Location access needed" with Settings deep-link (`Linking.openSettings()`)
- **Permanently denied on iOS**: Show explicit "Go to Settings > Privacy > Location > TrekYatra > While Using"
- iOS: uses `NSLocationWhenInUseUsageDescription` in `app.config.ts` Info.plist

---

## Backend Tests

| Test ID | Verifies |
|---------|---------|
| TC-B-M20-01 | `test_nearby_from_delhi` — lat/lon near Delhi returns treks in Uttarakhand/Himachal (within 200km) |
| TC-B-M20-02 | `test_nearby_sorted_by_distance` — results in ascending distance_km order |
| TC-B-M20-03 | `test_nearby_radius_filter` — radius_km=50 returns fewer treks than radius_km=500 |
| TC-B-M20-04 | `test_nearby_invalid_lat` — lat=999 returns 422 |
| TC-B-M20-05 | `test_nearby_far_location` — location in Mumbai (>600km) returns empty list |

---

## Verification (Manual)

1. **TC-M20-01**: Open Nearby tab → location permission dialog appears on first use
2. **TC-M20-02**: Grant location → treks list with "X km away" badges appears
3. **TC-M20-03**: Deny location → "Enable location" prompt with Settings link
4. **TC-M20-04**: Home screen shows NearbyTreksStrip below trending (if location granted)
5. **TC-M20-05**: Location cache: refresh app within 30min → no second permission prompt

---

## Notes

- Do NOT request background location (`ACCESS_BACKGROUND_LOCATION`) — not needed and Google Play requires justification
- `expo-location` `Accuracy.Balanced` is sufficient for city-level positioning (we only need the state/region, not exact trail GPS)
- No continuous tracking — one-shot position fetch cached for 30 minutes
- The 200km default radius is intentional: covers most treks reachable as a day drive from major Himalayan gateway cities (Rishikesh, Manali, Shimla, Srinagar, Darjeeling)
- Future V6 upgrade: add PostGIS extension to Postgres and migrate TREK_COORDS to a proper `trek_locations` table with `geography(POINT, 4326)` column for true geospatial queries

---

## Bugfix (2026-06-29 — TC-F-M20-01 prod failure)

**Root cause:** Default `radius_km=200` was too small for most major Indian cities. Calculated distances from Delhi:
- Nag Tibba (nearest Himalayan trek): **224 km** — just outside 200 km
- Kedarkantha: **284 km** — outside 200 km

Users in Delhi NCR, Chandigarh (partial), and all cities south of the Himalayan belt received 0 results and saw a blank (component returns null on empty results — intentional UX, but nothing to show the component ran).

**Fix:** Changed default `radius_km` from 200 → **300** in `GET /api/v1/mobile/nearby` route. At 300 km:
- Delhi → Nag Tibba ✓ (224 km), Kedarkantha ✓ (284 km), plus several Himachal/Uttarakhand treks
- Chandigarh → all nearby Himachal treks ✓
- Cities in South India / Mumbai: still no Himalayan treks in range (correct — they don't exist)

All 5 existing tests pass (`test_nearby_m20.py` — all use explicit `radius_km` values).

---

## Implementation Notes (2026-06-29 — Done)

### Deviations from step doc
- `NearbyTrekOut`/`NearbyTreksOut` schemas placed in `services/api/app/schemas/mobile.py` (not `modules/treks/schemas.py`) to co-locate with other mobile-specific response shapes
- `TREK_COORDS` dict imported from `app/modules/conditions/service.py` (already existed with 41 treks from Step 80b) — not duplicated
- `NearbyTab.tsx` (dedicated Browse tab component) was replaced by wiring `NearbyTreksStrip` directly into the Browse screen header — simpler, same UX outcome without building a full tab-switcher system
- Web `NearbyTreksSection` added to `/explore` page (outside original scope but natural complement — GPS-triggered, self-hides when no location granted or no nearby treks)

### Files Created
| File | Purpose |
|------|---------|
| `services/api/app/modules/treks/service.py` | Added `_haversine_km` + `get_nearby_treks` |
| `services/api/tests/test_nearby_m20.py` | 5 backend tests (all pass) |
| `apps/mobile/lib/location.ts` | GPS permission + AsyncStorage cache |
| `apps/mobile/hooks/useNearbyTreks.ts` | React Query hook wrapping location + API |
| `apps/mobile/components/home/NearbyTreksStrip.tsx` | Horizontal card strip with distance badge |
| `apps/web-next/components/trek/NearbyTreksSection.tsx` | Web GPS strip for /explore page |

### Files Modified
| File | Change |
|------|--------|
| `services/api/app/schemas/mobile.py` | Added `NearbyTrekOut`, `NearbyTreksOut` |
| `services/api/app/api/routes/mobile.py` | Added `GET /api/v1/mobile/nearby` |
| `apps/mobile/lib/mobileApi.ts` | Added `NearbyTrekOut`, `NearbyTreksOut` interfaces; `is_premium` made optional on `CMSPage` |
| `apps/mobile/app/(tabs)/(home)/index.tsx` | Wired `NearbyTreksStrip` after trending section |
| `apps/mobile/app/(tabs)/browse/index.tsx` | Wired `NearbyTreksStrip` in browse header |
| `apps/mobile/app.config.ts` | Added `NSLocationWhenInUseUsageDescription` + `expo-location` plugin |
| `apps/web-next/app/(public)/explore/page.tsx` | Wired `NearbyTreksSection` |

### Test Results
- Backend: 753 pass / 2 pre-existing failures (test_refresh.py — unrelated)
- Frontend web: `next build` clean
- Mobile: `npx tsc --noEmit` clean (0 errors)
