# App Store screenshots via Maestro

Automated capture of every TrekYatra USP on the 6.9" simulator (iPhone 17 Pro Max = App Store size).

## 0. Prereqs (once)
```bash
# install Maestro
curl -fsSL "https://get.maestro.mobile.dev" | bash
export PATH="$PATH":"$HOME/.maestro/bin"           # add to ~/.zshrc too
maestro --version

# app must be installed + Metro running (you already did `npx expo run:ios`)
xcrun simctl launch booted in.co.trekyatra.app     # if it isn't open
```

## 1. Clean Apple marketing status bar (9:41, full battery/signal)
```bash
xcrun simctl status_bar booted override \
  --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 \
  --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100
```

## 2. Capture
```bash
mkdir -p appstore-shots && cd appstore-shots        # screenshots land in the CWD

# public/guest screens — pass REAL slugs from your live content:
maestro test ../.maestro/appstore.yaml \
  -e TREK_SLUG=your-real-trek-slug \
  -e NEWS_SLUG=your-real-news-slug

# sign in on the simulator, then the account screens:
maestro test ../.maestro/account.yaml
```

## 3. If a tap doesn't match a screen
Open the interactive inspector, tap around, and copy the exact selector Maestro suggests:
```bash
maestro studio
```
Common tweaks: the Filter-sheet close button label, or a trek sub-tab that needs a scroll first.

## 4. Reset the status bar when done
```bash
xcrun simctl status_bar booted clear
```

## Coverage (25 shots)
Home · Explore · Filters · Search · Trek hero · Photo gallery · Trek details · Packing · Permits ·
Costs · Conditions/trip-reports · TrekSage · Plan · Compare · Operators · Beginner · News · Drawer ·
Account · Saved · Comparisons · History · Notifications · Settings. For a **dark-mode** set, toggle
dark in Settings and re-run `appstore.yaml` into a `appstore-shots-dark/` folder.

> `openLink` uses the `trekyatra://` scheme. If a deep link doesn't route in the dev build, navigate
> to that screen with taps instead (the tab bar + cards), then `maestro studio` → screenshot.
