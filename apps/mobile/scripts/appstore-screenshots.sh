#!/usr/bin/env bash
# =============================================================================
# TrekYatra — App Store screenshot capture (iOS Simulator)
# Captures every feature/USP screen at the 6.9" size (iPhone 17 Pro Max, 1320×2868).
#
# PREREQ (one-time): a SIMULATOR dev build must be installed & running on the sim.
#   The production .ipa is device-only, so build/run a simulator build first:
#       npx expo run:ios --device "iPhone 17 Pro Max"
#   Leave the app running, then run this script in a second terminal.
#
# Fill in a few REAL slugs below (from your live content) before running.
# =============================================================================
set -euo pipefail

# ---- Config: put REAL slugs here (see them in the app / on trekyatra.co.in) ----
TREK_SLUG="${TREK_SLUG:-churdhar-trek-complete-guide-to-himachals-highest-peak}"
NEWS_SLUG="${NEWS_SLUG:-hemis-national-park-how-to-reach}"
GUIDE_SLUG="${GUIDE_SLUG:-}"          # optional: a trek_guide sub-article slug
OPERATOR_SLUG="${OPERATOR_SLUG:-}"    # optional: an operator slug
REGION="${REGION:-Himachal%20Pradesh}"
SEASON="${SEASON:-winter}"

SIM="iPhone 17 Pro Max"
SCHEME="trekyatra://"
OUT="${OUT:-./appstore-shots}"
DELAY="${DELAY:-3.5}"                 # seconds to let each screen load before the shot
mkdir -p "$OUT"

# ---- Boot the sim + clean marketing status bar (9:41, full battery/signal) ----
xcrun simctl boot "$SIM" 2>/dev/null || true
open -a Simulator
sleep 3
xcrun simctl status_bar "$SIM" override \
  --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 \
  --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100

shot() {  # shot <name> <deeplink-path>
  local name="$1" path="$2"
  echo "→ $name  ($path)"
  xcrun simctl openurl "$SIM" "${SCHEME}${path}"
  sleep "$DELAY"
  xcrun simctl io "$SIM" screenshot "$OUT/${name}.png" >/dev/null
}

echo "== Capturing to $OUT (device: $SIM) =="

# ---------------- DISCOVERY / HOME ----------------
shot 01-home                 ""                    # personalized Home ("For {name}", search, popular)
shot 02-explore              "browse"              # Explore grid + Filters entry
shot 03-search               "browse/search"       # AI search (add ?voice=1 for voice)

# ---------------- TREK DETAIL (core USP) ----------------
shot 04-trek-detail          "trek/${TREK_SLUG}"           # hero + summary card (route + metadata + photo tour)
shot 05-trek-guide           "trek/${TREK_SLUG}"           # Trek details table + Guide (same screen, scroll)
# NOTE: Gallery, Packing/Permits/Costs/Conditions tabs, Trail-route map, Ask-TrekSage,
#       Trek-buddies, Live-conditions, and the "I did this trek" check-in are IN-SCREEN
#       (tabs/sheets) — capture them MANUALLY (see the manual list printed at the end).

# ---------------- AI / PLANNING ----------------
shot 06-treksage             "treksage"            # TrekSage AI assistant
shot 07-plan                 "plan"                # Plan-my-trek wizard (start)
shot 08-compare              "compare"             # AI trek comparison

# ---------------- CONTENT / GUIDES ----------------
shot 09-beginner             "beginner"            # Beginner treks guide
shot 10-news                 "news/${NEWS_SLUG}"   # News article (web-parity layout)
shot 11-safety               "safety"              # Safety guidelines
[ -n "$GUIDE_SLUG" ]    && shot 12-guide     "guide/${GUIDE_SLUG}"

# ---------------- OPERATORS ----------------
shot 13-operators            "browse/operators"    # Verified trek operators
[ -n "$OPERATOR_SLUG" ] && shot 14-operator  "browse/operators/${OPERATOR_SLUG}"

# ---------------- REGION / SEASON HUBS ----------------
shot 15-region               "browse/regions/${REGION}"
shot 16-season               "browse/seasons/${SEASON}"

# ---------------- ACCOUNT (run these while SIGNED IN) ----------------
shot 17-account              "account"             # Profile dashboard
shot 18-saved                "saved"               # Saved treks
shot 19-comparisons          "saved/comparisons"   # Saved comparisons
shot 20-history              "account/history"     # Trek history
shot 21-notifications        "notifications"       # Notification centre
shot 22-settings             "account/settings"    # Settings (dark-mode toggle, version)

# ---------------- AUTH / ONBOARDING (run these while SIGNED OUT) ----------------
# shot 23-welcome            "welcome"
# shot 24-onboarding         "onboarding"
# shot 25-signin             "sign-in"

echo ""
echo "== Done. Deep-linkable screens captured to $OUT =="
cat <<'MANUAL'

── CAPTURE THESE MANUALLY (in-screen tabs/sheets — deep links can't open them) ──
Navigate in the app, then:  xcrun simctl io "iPhone 17 Pro Max" screenshot ./appstore-shots/NAME.png

  M1  Explore → tap "Filters"                 → filter sheet (Region/Difficulty/Season/Suitability/Duration)
  M2  Trek detail → tap "Photo tour"          → full-screen photo gallery
  M3  Trek detail → Packing / Permits / Costs → each structured guide tab
  M4  Trek detail → Conditions tab            → trip reports + trail conditions
  M5  Trek detail → scroll to Ask TrekSage    → on-trek AI Q&A
  M6  Trek detail → scroll to Trek Buddies    → buddy matching
  M7  Trek detail → Live Conditions widget    → weather / live conditions detail
  M8  Trek detail → "I did this trek — log it"→ check-in sheet
  M9  Home/any → open the hamburger (☰)       → branded drawer menu
  M10 Plan → step 1..6                        → the 6-step wizard, then Plan results
  M11 Search → tap the mic                    → voice search
  M12 Dark mode: Settings → toggle dark, then re-shoot 01/04/06 for a dark-mode set

TIP: reset the status bar when finished:  xcrun simctl status_bar "iPhone 17 Pro Max" clear
MANUAL
