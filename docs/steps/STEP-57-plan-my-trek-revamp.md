# Step 57 — Plan My Trek Feature Revamp

## Status: Pending — Spec Complete, Ready for Implementation

---

## 1. Feature Objective

Help users move from uncertainty to a clear shortlist of published treks based on intent, season, duration, budget, fitness, experience level, and region preference.

**Core product promise:** 6 quick questions → top 5 CMS-published trek recommendations with match scores, explanations, comparison, and lead capture.

---

## 2. Entry Points (Frontend Touchpoints to Update)

| Location | CTA Copy | Component |
|----------|----------|-----------|
| Homepage hero | "Plan My Trek" (primary button) | Already exists — keep |
| Header nav | "Plan My Trek" button | Already exists |
| Trek listing pages | "Not sure where to trek? Plan your trek in 60 seconds" | Add inline CTA banner |
| Trek detail sidebar | "Not sure? Get matched to better treks" | Add to right sidebar |
| Trek comparison page | "Get personalized recommendations instead" | Add after compare table |
| Mobile sticky CTA | "Plan My Trek" sticky bottom bar on all public pages | Add to layout |

---

## 3. V1 Wizard — 6 Steps

### Step 1: Welcome Screen (Static, no input)
- H1: "Find your ideal trek in under 60 seconds."
- Sub: "Tell us your travel style, fitness level, preferred season, and budget."
- Primary CTA: "Start Planning"
- Secondary CTA: "Browse all treks instead" → /explore

### Step 2: Trek Intent (What kind of trek?)
Single-select + optional multi-select. Map to computed `tags` field on treks.

| Option | Tag mapping |
|--------|-------------|
| Beginner-friendly trek | suitability: Beginners, difficulty: Easy |
| Snow trek | tags: snow, season: Dec–Apr |
| Valley / meadow trek | tags: valley meadow |
| Adventure / challenging | difficulty: Difficult/Challenging/Very Difficult |
| Weekend trek | duration: 1–3 days |
| Family-friendly trek | suitability: Family |
| Solo traveller-friendly | suitability: Solo |
| Scenic photography trek | tags: scenic photography |
| Spiritual / temple trek | tags: spiritual temple |
| Not sure — recommend for me | no filter, show top-ranked |

### Step 3: When are you planning to go? (Month/Season)
Grouped chips: Jan–Feb, Mar–Apr, May–Jun, Jul–Aug, Sep–Oct, Nov–Dec, Not decided.

Month-to-trek-season mapping (same logic as buildSearchTags in search):
- Jan, Feb, Mar, Apr → Winter/Spring treks
- Apr, May, Jun → Summer treks  
- Jun, Jul, Aug, Sep → Monsoon treks
- Sep, Oct, Nov → Autumn treks
- Nov, Dec, Jan, Feb → Winter snow treks

### Step 4: How many days do you have? (Duration)
Options: 1 day, 2–3 days, 4–5 days, 6–7 days, 8+ days, Flexible.

Maps to `trek_duration` column (parsed to day count).

### Step 5: Trekking experience + Fitness
**Experience:**
- Never trekked before → Easy only
- Done 1–2 easy treks → Easy, Easy–Moderate
- Comfortable with moderate treks → Moderate, Moderate–Difficult
- Experienced trekker → Any difficulty
- Looking for a difficult expedition → Difficult, Very Difficult, Challenging

**Fitness:**
- Low → 1 day treks, Easy only
- Average → Easy, Easy–Moderate
- Good → Moderate, Moderate–Difficult
- Very good → Any

Difficulty recommendation = min(experience_level, fitness_level) — safer of the two.

### Step 6: Budget + Region (Combined step to reduce friction)
**Budget:**
- Under ₹5,000 | ₹5,000–₹10,000 | ₹10,000–₹15,000 | ₹15,000–₹25,000 | ₹25,000+ | Flexible

Maps to `trek_facts.permits` + estimated cost signals from CMS content_json.

**Region:**
- Uttarakhand | Himachal Pradesh | Kashmir | Ladakh | Sikkim | Maharashtra / Sahyadris | Karnataka / Western Ghats | North East | No preference

Maps to `trek_state` column on `cms_pages`.

---

## 4. Recommendation Engine

### Input Schema (submitted to backend)
```json
{
  "intent": ["beginner", "snow"],
  "months": ["Dec", "Jan", "Feb", "Mar"],
  "duration_days_min": 4,
  "duration_days_max": 7,
  "experience_level": "never",
  "fitness_level": "average",
  "budget_min": 5000,
  "budget_max": 15000,
  "region": "Uttarakhand",
  "comfort_preferences": ["beginner_safety", "scenic_views"]
}
```

### Matching Weights (from PRD)
| Factor | Weight |
|--------|--------|
| Season match | 25% |
| Difficulty fit | 20% |
| Duration fit | 15% |
| Budget fit | 15% |
| Region match | 10% |
| Intent/theme match | 10% |
| Traveller type suitability | 5% |

### Scoring Algorithm (per trek)
```python
def score_trek(trek: CMSPage, input: PlanInput) -> float:
    score = 0.0
    
    # Season match (25%)
    if season_overlaps(trek.trek_season, input.months):
        score += 0.25
    elif season_partial_overlap(trek.trek_season, input.months):
        score += 0.12
    
    # Difficulty fit (20%)
    user_max_difficulty = get_max_difficulty(input.experience_level, input.fitness_level)
    trek_difficulty = normalize_difficulty(trek.trek_difficulty)
    if trek_difficulty <= user_max_difficulty:
        score += 0.20 * (1 - abs(trek_difficulty - user_max_difficulty) / 6)
    
    # Duration fit (15%)
    trek_days = parse_duration_days(trek.trek_duration)
    if input.duration_days_min <= trek_days <= input.duration_days_max:
        score += 0.15
    elif abs(trek_days - input.duration_days_min) <= 1:
        score += 0.08  # 1 day off
    
    # Budget fit (15%) — uses cost_estimate from trek_facts or CMS content
    # Placeholder until cost column added: use difficulty as proxy
    score += 0.15 * get_budget_fit(trek, input)
    
    # Region match (10%)
    if input.region and trek.trek_state and input.region.lower() in trek.trek_state.lower():
        score += 0.10
    elif not input.region:
        score += 0.10  # No preference = full score
    
    # Intent/theme match (10%)
    score += 0.10 * get_intent_match(trek, input.intent)
    
    # Traveller type suitability (5%)
    score += 0.05 * get_suitability_match(trek, input)
    
    return round(score * 100)  # Return as 0-100 match score
```

### Trek Data Source
**Primary:** Published `cms_pages` where `page_type = 'trek_guide'` and `status = 'published'`.
Matching uses: `trek_state`, `trek_difficulty`, `trek_duration`, `trek_season`, `trek_suitability`, `content_json.trek_facts.*`.

**No static `treks.ts` data** — all recommendations come from the live CMS DB. This ensures new pipeline-published treks automatically appear in Plan My Trek.

### Result Categories (5 recommendations)
1. **Best Match** — highest overall score
2. **Safer Beginner Option** — highest score with difficulty ≤ user's max difficulty - 1
3. **More Adventurous Option** — highest score with difficulty = user's max difficulty + 1
4. **Budget-Friendly Option** — highest score among lowest-cost treks
5. **Comparison Pick** — most commonly compared with #1 (from `page_links` or cluster similarity)

### Edge Cases
| Scenario | Handling |
|----------|----------|
| No CMS treks match all criteria | Relax constraints one by one: region → season → difficulty → duration |
| No results at all | "No exact match — here are the closest treks based on your preferences" + show top 3 by season only |
| Beginner selects expedition trek | Warning: "This may be too demanding for your current profile. Here are safer alternatives." |
| Trek outside best season | Flag: "Typically not recommended in [selected month]. Here are alternatives." |
| Budget mismatch | Flag: "Your budget may be lower than usual costs. Explore these alternatives." |
| Snow trek + July + Maharashtra | "Snow treks aren't available in Maharashtra in July. Here are monsoon Sahyadri alternatives." |
| Only 1–2 treks match | Show results + "Expand your criteria" prompts |

---

## 5. Output Page — Recommendation Results

### URL: `/plan/results` or `/plan/{plan_id}`

### Header
```
Your TrekYatra Plan is Ready
Based on your [season] season, [difficulty] fitness level, [duration]-day duration, 
and [region] region preference, here are your top matches.
```

### Recommendation Card Fields
```
Trek Name                  [trek_name from cms_pages]
Match Score                [92%] — displayed as progress bar
Region / State             [trek_state]
Duration                   [trek_duration]
Maximum Altitude           [trek_facts.altitude]
Difficulty                 [trek_difficulty]
Best Season                [trek_season]
Permit Required            [trek_facts.permits → Yes/No]
Base Location              [trek_facts.base]
Estimated Budget           [from trek_facts.cost_estimate or CMS sections]
Why this matches you       [LLM-generated explanation using scoring factors]
```

### Why this matches — AI Explanation Format
```
Based on your preferences, [trek_name] is your strongest match because it fits 
your [selected season] season, [experience level] experience level, [N]-day duration, 
and [intent] preference. However, [trade-off]. If you want a quieter alternative, 
consider [alternative trek]. If trekking [solo/with family], we recommend [suggestion].
```
The AI must only use data from `cms_pages` + `trek_facts`. No invented data.

### CTAs per card
- Primary: "View Trek" → `/trek/{slug}`
- Secondary: "Compare" → adds to compare list
- Tertiary: "Talk to Operator / Get Help" → lead capture form

### Post-results comparison trigger
"Confused between two treks? Compare your recommended treks."
→ Allow selecting 2–3 from the 5 results → link to `/compare?slugs=a,b,c`

---

## 6. Lead Capture Flow

**Sequence**: Show recommendations FIRST, then offer lead capture (never gate results behind a form).

### Lead Capture Prompt (after results shown)
"Want this plan on WhatsApp?"
- Name
- Phone number
- City
- Preferred travel month
- Number of travellers

CTAs: "Send My Trek Plan on WhatsApp" | "Continue without sharing number"

### Backend
- POST /api/v1/leads with source: "plan_my_trek"
- Save plan preferences + recommended treks to `trip_plans` table (already exists)
- Send WhatsApp message via existing WhatsApp integration (if configured)

### Operator Connection (V1 simplified)
If operator inventory not ready: "Request operator callback" form (→ leads table).
V2: Match to specific operators by region + availability.

---

## 7. Technical Implementation Plan

### Phase 1 — Recommendation Engine (Backend)
**New endpoint:** `POST /api/v1/plan/recommend`
```python
@router.post("/recommend", response_model=PlanRecommendResponse)
def recommend_treks(payload: PlanRecommendRequest, db: Session = Depends(get_db)):
    """Score all published trek_guide CMS pages against user inputs.
    Returns top 5 with scores, explanations, and result categories."""
```

**New schemas:**
```
PlanRecommendRequest:
  intent: list[str]
  months: list[str]  # ["Dec", "Jan", "Feb"]
  duration_min: int
  duration_max: int
  experience_level: str  # "never" | "easy" | "moderate" | "experienced" | "expert"
  fitness_level: str  # "low" | "average" | "good" | "very_good"
  budget_min: int | None
  budget_max: int | None
  region: str | None
  comfort_preferences: list[str]

PlanRecommendResponse:
  recommendations: list[TrekRecommendation]  # top 5
  result_categories: dict[str, TrekRecommendation]  # best_match, safer, adventurous, budget, comparison
  
TrekRecommendation:
  slug: str
  name: str
  match_score: int  # 0-100
  why_this_matches: str  # LLM explanation
  category: str  # best_match | safer | adventurous | budget | comparison
  trek_data: CMSPageResponse  # full CMS page data
  warnings: list[str]  # season mismatch, difficulty warning, budget gap
```

### Phase 2 — AI Explanation Layer
Use the existing content writing agent pattern. The explanation prompt:
```
You are TrekYatra's recommendation engine. Given a user's preferences and 
the matching scores for [{trek_name}], write a 2–3 sentence explanation of 
why this trek matches their profile. Use ONLY the data provided. Do not invent 
altitude, cost, or permit information.

User preferences: {preferences_summary}
Trek data: {trek_name}, difficulty: {difficulty}, season: {season}, 
duration: {duration}, state: {state}, suitability: {suitability}
Match reasons: {matching_factors_that_scored}
Trade-offs: {low_scoring_factors}
```

### Phase 3 — Frontend (Multi-step wizard rewrite)
**Current state:** 4-step form → generates itinerary text via AI → stores in `trip_plans`.
**New state:** 6-step wizard → recommendation engine → 5 trek cards with CTAs.

**Frontend files to rewrite:**
- `apps/web-next/app/(public)/plan/page.tsx` — complete rewrite from 4-step to 6-step wizard
- New: `apps/web-next/components/plan/WizardStep.tsx` — reusable step component
- New: `apps/web-next/components/plan/RecommendationCard.tsx` — trek result card
- New: `apps/web-next/components/plan/LeadCaptureModal.tsx` — post-results lead form

**URL structure (confirm and add to URL_MAP.md):**
- `/plan` — wizard entry point (existing)
- `/plan/results` — recommendations output (new — add to URL_MAP.md)

### Phase 4 — Trek Data Enrichment
To enable full budget matching, add to pipeline content writing:
- Extract `estimated_budget` from the trek guide content into a structured field
- OR: Add `trek_budget_min` + `trek_budget_max` columns to cms_pages (new migration)

---

## 8. New Backend Endpoint Summary

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/plan/recommend` | Score CMS treks against user preferences → top 5 |
| POST | `/api/v1/plan/generate` (existing) | Keep for backward compat (itinerary generation) |
| GET | `/api/v1/plan/{plan_id}` (existing) | Retrieve saved plan |
| POST | `/api/v1/plan/{plan_id}/email` (existing) | Email plan to user |

---

## 9. Trek Entity Mappings

All trek data comes from `cms_pages` WHERE `page_type = 'trek_guide'` AND `status = 'published'`.

| Plan Input | cms_pages column / trek_facts key |
|-----------|----------------------------------|
| Season → month overlap | `trek_season` (e.g. "Dec – Apr") |
| Difficulty recommendation | `trek_difficulty` (e.g. "Moderate") |
| Duration | `trek_duration` (e.g. "6 days") → parse to int |
| Region / State | `trek_state` (e.g. "Uttarakhand") |
| Suitability | `trek_suitability` (e.g. "Beginners, Intermediate") |
| Altitude (display only) | `content_json.trek_facts.altitude` |
| Permits (display only) | `content_json.trek_facts.permits` |
| Base location (display) | `content_json.trek_facts.base` |
| Image | `hero_image_url` |
| Trek name | `trek_name` or `title` |
| Trek URL | `/trek/{slug}` |

---

## 10. Files to Create/Modify

### Backend
- `services/api/app/modules/plan/service.py` — add `recommend_treks()` scoring function
- `services/api/app/schemas/plan.py` — add `PlanRecommendRequest`, `PlanRecommendResponse`, `TrekRecommendation`
- `services/api/app/api/routes/plan.py` — add `POST /recommend` endpoint

### Frontend
- `apps/web-next/app/(public)/plan/page.tsx` — rewrite from 4-step to 6-step wizard
- `apps/web-next/app/(public)/plan/results/page.tsx` — NEW: recommendation output page
- `apps/web-next/components/plan/WizardStep.tsx` — NEW: reusable wizard step shell
- `apps/web-next/components/plan/RecommendationCard.tsx` — NEW: trek recommendation card
- `apps/web-next/components/plan/LeadCaptureModal.tsx` — NEW: lead capture after results
- `apps/web-next/lib/api.ts` — add `planRecommendTreks()` function

### Documentation
- `docs/URL_MAP.md` — add `/plan/results`
- `docs/MASTER_TRACKER.md` — update Step 57 status when done

---

## 11. Out of Scope for V1

- Mobile app version
- WhatsApp bot integration (just the lead form with phone number)
- Operator matching by availability calendar
- Saved plan comparison history
- Real-time operator callback scheduling
- Budget column on cms_pages (use difficulty as proxy initially)

---

## 12. Acceptance Criteria

- [ ] 6-step wizard completes without error
- [ ] Top 5 trek recommendations returned from live CMS (not static data)
- [ ] Match scores accurately reflect the weighted scoring formula
- [ ] "Why this matches" explanation uses only real trek data (no invented facts)
- [ ] Edge cases handled: no match, out-of-season, beginner selects expert trek
- [ ] Lead capture form saves to leads table with source = "plan_my_trek"
- [ ] Recommendations link to real CMS trek pages (`/trek/{slug}`)
- [ ] `/plan/results` URL works and can be bookmarked/shared
- [ ] All backend tests pass; `next build` clean
- [ ] URL_MAP.md updated with `/plan/results`
