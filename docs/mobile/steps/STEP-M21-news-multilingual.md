# STEP-M21 — News Feed & Multilingual Support

**Status:** Pending
**Phase:** Engagement
**Dependencies:** STEP-M01 (foundation — i18n setup), STEP-M04 (offline content — article caching), STEP-M10 (language toggle in Settings)

---

## Scope

Two deliverables in one step: (1) a native News tab surfacing trek news articles from the CMS, and (2) app-wide multilingual support for Hindi and English. News articles are pulled from the same CMS pipeline as the web. Language is toggled in Settings and stored in AsyncStorage — all UI strings and CMS content re-render in the selected language. OS locale is detected on first launch to set the initial language.

---

## Files to Create

### Mobile
| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/news.tsx` | News tab root screen — article feed |
| `apps/mobile/app/(tabs)/news/[slug].tsx` | Article detail screen |
| `apps/mobile/components/news/ArticleCard.tsx` | Article list card (thumbnail, title, category, date) |
| `apps/mobile/components/news/ArticleDetail.tsx` | Article body renderer (CMSContentRenderer reuse) |
| `apps/mobile/hooks/useNews.ts` | Fetch articles with infinite scroll |
| `apps/mobile/lib/i18n.ts` | i18n setup — expo-localization + i18n-js |
| `apps/mobile/locales/en.json` | English UI strings |
| `apps/mobile/locales/hi.json` | Hindi UI strings |
| `apps/mobile/hooks/useLocale.ts` | Language preference: read/write AsyncStorage + force re-render |
| `apps/mobile/providers/LocaleProvider.tsx` | Global locale context — wraps root layout |

---

## News Tab: Article Feed

```
[Page: "Trek News"]
[Filter chips: All  |  Permits  |  Conditions  |  Tips  |  Policy]
────────────────────────────────
[ArticleCard]
  [Hero thumbnail]
  Permits
  "Kedarkantha permit quota increased for Dec 2026"
  May 28, 2026  · 3 min read

[ArticleCard]
  Conditions
  "Valley of Flowers: monsoon opens July 1"
  May 25, 2026  · 2 min read
────────────────────────────────
```

- `GET /api/v1/public/news?category=&page=&lang=` — returns CMS news_article pages
- Filter chips map to `page_type = news_article` categories
- Infinite scroll using TanStack Query `useInfiniteQuery`
- Pull-to-refresh updates the feed

---

## Article Detail Screen

```
[Hero image — full width, 240px]
[Category badge]  [Date]  [X min read]
[Article title — large]
────────────────────────────────
[CMSContentRenderer body_json]
  (renders paragraphs, headings, images, callouts)
────────────────────────────────
[Share article] (native share sheet)
[Related articles — 2 cards horizontal]
```

Reuses `CMSContentRenderer` from STEP-M04 — all block types already implemented. Article body is the CMS `body_json` field. Hindi content served from `title_hi`, `body_json_hi` CMS fields (if populated; falls back to English if Hindi translation absent).

---

## News API Endpoint

Add to `services/api/app/api/routes/public.py` or `cms.py`:

```python
@public_router.get("/news")
async def list_news(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    lang: str = Query("en", regex="^(en|hi)$"),
    db: AsyncSession = Depends(get_db),
):
    """Returns published news_article CMS pages, newest first"""
    ...
```

Response includes: `slug`, `title` (or `title_hi` if `lang=hi`), `hero_image_url`, `category`, `reading_time_minutes`, `published_at`.

---

## Multilingual: Architecture

### Language Detection (first launch)
```typescript
// lib/i18n.ts
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

export const i18n = new I18n({ en, hi });

export async function initLocale(): Promise<void> {
  const stored = await AsyncStorage.getItem('app_language');
  if (stored) {
    i18n.locale = stored;
  } else {
    // OS locale detection
    const deviceLocale = Localization.locale; // e.g. "hi-IN"
    i18n.locale = deviceLocale.startsWith('hi') ? 'hi' : 'en';
    await AsyncStorage.setItem('app_language', i18n.locale);
  }
  i18n.enableFallback = true;
}
```

### LocaleProvider
```tsx
// providers/LocaleProvider.tsx
export const LocaleContext = createContext<{
  locale: string;
  setLocale: (l: string) => Promise<void>;
}>({ locale: 'en', setLocale: async () => {} });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    initLocale().then(() => setLocaleState(i18n.locale));
  }, []);

  const setLocale = async (lang: string) => {
    i18n.locale = lang;
    setLocaleState(lang);
    await AsyncStorage.setItem('app_language', lang);
    // Force re-fetch of CMS content in new language
    queryClient.invalidateQueries();
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
```

### useLocale Hook
```typescript
export function useLocale() {
  return useContext(LocaleContext);
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
```

---

## UI Strings: en.json (Sample)

```json
{
  "tabs": {
    "home": "Home",
    "explore": "Explore",
    "plan": "Plan Trek",
    "news": "News",
    "account": "Account"
  },
  "home": {
    "nearby_title": "Treks Near You",
    "trending_title": "Trending Treks",
    "recently_viewed": "Pick Up Where You Left Off",
    "for_you": "For You"
  },
  "trek": {
    "difficulty_easy": "Easy",
    "difficulty_moderate": "Moderate",
    "difficulty_challenging": "Challenging",
    "save": "Save Trek",
    "saved": "Saved",
    "log_this_trek": "Log This Trek"
  },
  "account": {
    "sign_in": "Sign In",
    "sign_out": "Sign Out",
    "settings": "Settings",
    "saved_treks": "Saved Treks",
    "downloads": "Downloads",
    "premium": "Premium"
  },
  "common": {
    "loading": "Loading…",
    "error_try_again": "Something went wrong. Try again.",
    "no_results": "No results found.",
    "search_placeholder": "Search treks…"
  }
}
```

---

## UI Strings: hi.json (Sample)

```json
{
  "tabs": {
    "home": "होम",
    "explore": "खोजें",
    "plan": "ट्रेक प्लान",
    "news": "समाचार",
    "account": "अकाउंट"
  },
  "home": {
    "nearby_title": "आपके पास के ट्रेक",
    "trending_title": "ट्रेंडिंग ट्रेक",
    "recently_viewed": "जहाँ आप रुके थे",
    "for_you": "आपके लिए"
  },
  "trek": {
    "difficulty_easy": "आसान",
    "difficulty_moderate": "मध्यम",
    "difficulty_challenging": "कठिन",
    "save": "सेव करें",
    "saved": "सेव किया",
    "log_this_trek": "ट्रेक लॉग करें"
  },
  "account": {
    "sign_in": "साइन इन",
    "sign_out": "साइन आउट",
    "settings": "सेटिंग्स",
    "saved_treks": "सेव किए ट्रेक",
    "downloads": "डाउनलोड",
    "premium": "प्रीमियम"
  },
  "common": {
    "loading": "लोड हो रहा है…",
    "error_try_again": "कुछ गलत हुआ। फिर कोशिश करें।",
    "no_results": "कोई परिणाम नहीं मिला।",
    "search_placeholder": "ट्रेक खोजें…"
  }
}
```

---

## Language Toggle in Settings

In STEP-M10 Settings screen:
```tsx
const { locale, setLocale } = useLocale();

<TouchableOpacity onPress={() => setLocale(locale === 'en' ? 'hi' : 'en')}>
  <Text>{locale === 'en' ? 'Switch to हिंदी' : 'Switch to English'}</Text>
</TouchableOpacity>
```

On toggle: `queryClient.invalidateQueries()` re-fetches all CMS content with `?lang={newLocale}` added to API calls.

---

## CMS Content in Hindi

Hindi CMS content approach:
- CMS pages have `title_hi` and `body_json_hi` fields (already in schema from web Hindi content work)
- Mobile API client adds `lang` query param to all CMS fetch calls
- Backend returns Hindi fields when `lang=hi` and Hindi content is available; falls back to English
- If no Hindi translation exists: English content shown (no empty states)

---

## Offline Support for News

News articles cached in SQLite via STEP-M04 sync engine:
- `cmsPages` table `page_type = 'news_article'` rows cached on background sync
- News feed works offline using SQLite query
- Article content (body_json) cached for last 20 articles viewed
- Push notification `news_article` category deeplinks to `/(tabs)/news/[slug]`

---

## Verification (Manual)

1. **TC-M21-01**: News tab loads with articles sorted newest first
2. **TC-M21-02**: Filter by "Permits" → only permit-related articles shown
3. **TC-M21-03**: Tap article → full content renders with CMSContentRenderer
4. **TC-M21-04**: Toggle to Hindi in Settings → tab labels + article titles re-render in Hindi
5. **TC-M21-05**: OS language = Hindi on fresh install → app opens in Hindi
6. **TC-M21-06**: Article in Hindi shows `title_hi` if available, falls back to English title
7. **TC-M21-07**: Airplane mode → cached news articles still readable
8. **TC-M21-08**: Share article → native share sheet with article title + URL

---

## Notes

- `i18n-js` is the React Native counterpart to `next-intl` used on the web — same translation key structure is recommended for consistency
- Hindi translations should cover all UI chrome strings. CMS content translation is best-effort (translated articles only, no machine translation)
- Tab bar labels must update immediately on language toggle — achieved by reading `locale` from context in the tab layout file
- Devanagari script renders correctly on both iOS and Android without custom fonts — system fonts handle Hindi natively
- Do NOT use `expo-localization` alone for locale management — it reads device locale but doesn't persist user preference across sessions
