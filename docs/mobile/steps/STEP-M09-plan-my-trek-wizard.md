# STEP-M09 — Plan My Trek Wizard

**Status:** Pending
**Phase:** User & Commerce
**Dependencies:** STEP-M02 (auth for lead capture), STEP-M05 (trek cards in results)

---

## Scope

Full native parity with the web `/plan` wizard. A 6-step full-screen native wizard that collects the user's intent, month, duration, fitness, experience, and region, then calls the plan scoring API and shows ranked trek recommendations. Lead capture form at the end connects to the operator inquiry pipeline.

The Plan tab is a prominent bottom tab (sparkles icon, accent background) — visible to all users.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/plan.tsx` | Plan tab root → intro screen |
| `apps/mobile/app/(tabs)/plan/step-1.tsx` | Intent selection |
| `apps/mobile/app/(tabs)/plan/step-2.tsx` | Month selection |
| `apps/mobile/app/(tabs)/plan/step-3.tsx` | Duration preference |
| `apps/mobile/app/(tabs)/plan/step-4.tsx` | Fitness + experience |
| `apps/mobile/app/(tabs)/plan/step-5.tsx` | Region preference |
| `apps/mobile/app/(tabs)/plan/step-6.tsx` | Lead capture (name, email, phone) |
| `apps/mobile/app/(tabs)/plan/results.tsx` | Top 5 trek recommendations |
| `apps/mobile/components/plan/WizardProgress.tsx` | Step indicator (6 dots) |
| `apps/mobile/components/plan/WizardStepLayout.tsx` | Full-screen step wrapper with back/next |
| `apps/mobile/components/plan/IntentSelector.tsx` | Step 1: intent grid |
| `apps/mobile/components/plan/MonthSelector.tsx` | Step 2: 12-month grid |
| `apps/mobile/components/plan/DurationSelector.tsx` | Step 3: duration options |
| `apps/mobile/components/plan/FitnessSliders.tsx` | Step 4: fitness + experience sliders |
| `apps/mobile/components/plan/RegionSelector.tsx` | Step 5: state multi-select |
| `apps/mobile/components/plan/LeadCaptureForm.tsx` | Step 6: contact form |
| `apps/mobile/components/plan/PlanResultCard.tsx` | Result card with match score + category |
| `apps/mobile/stores/planWizardStore.ts` | Zustand: wizard answers + results state |

---

## Wizard Steps

### Step 0 — Intro Screen (Plan tab root)
```
[Hero image — mountain dawn]
"Plan your perfect trek"
"Answer 6 questions. We'll match you to the right trek and operator."
[Start Planning →]
```

### Step 1 — What kind of trek?
6 intent tiles in 2×3 grid with icons:
- 🏔 Adventure & challenge
- 🌱 Beginner-friendly
- 🌧 Monsoon magic
- 👨‍👩‍👧 Family-friendly
- 🧍 Solo trekker
- 👥 Group / friends trip

Multi-select allowed. Same options as web.

### Step 2 — When are you planning to go?
12-month grid (Jan–Dec) + "I'm flexible" chip.
Current month pre-highlighted. Multi-select.

### Step 3 — How long can you trek?
4 duration options (full-width cards):
- 1–2 days (Weekend)
- 3–5 days (Short)
- 6–8 days (Standard)
- 9+ days (Extended)

### Step 4 — Your fitness & experience
Two sliders:
- Fitness level: Beginner → Athletic (1–5)
- Trekking experience: First timer → Expert (0–4)

Visual labels below each point.

### Step 5 — Preferred region
State multi-select (same as web):
- Uttarakhand, Himachal Pradesh, Jammu & Kashmir, Ladakh, Maharashtra, West Bengal / Sikkim, Any region

### Step 6 — Your contact details (optional)
```
Name (required)
Email (required)
Phone (optional)
"An operator will reach out within 48 hours with a personalised plan."
[Skip →]  [Get my plan →]
```

---

## Results Screen

```
"Your top trek matches"
────────────────────────────────
[#1] Kedarkantha            Match: 94%
     Uttarakhand · 6 days · Moderate
     [Category: Perfect for beginners]
     [View trek →]

[#2] Brahmatal              Match: 87%
     ...

[#3–#5] ...
────────────────────────────────
[Talk to an operator about any of these →]
```

`POST /api/v1/plan/search` — same endpoint as web.

---

## Analytics Events

Same events as web (wired in Step M15):
- `plan_wizard_started`
- `plan_wizard_step_1` through `plan_wizard_step_5`
- `plan_wizard_completed`
- `plan_lead_submitted`

---

## Verification

1. **TC-M09-01**: Complete all 6 steps → results screen shows 5 ranked treks
2. **TC-M09-02**: Back button on each step goes to previous step without losing answers
3. **TC-M09-03**: Skip lead capture (Step 6) → results still shown
4. **TC-M09-04**: Submit lead with name + email → success state shown + lead in admin leads list
5. **TC-M09-05**: Tap "View trek" on result → navigates to trek detail screen
6. **TC-M09-06**: Step progress indicator updates correctly on each step
7. **TC-M09-07**: Results match web results for same inputs (API parity check)
