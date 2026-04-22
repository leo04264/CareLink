# CareLink — Expo App

React Native + Expo implementation of the CareApp prototype. See `README.md` and `CareApp Prototype.html` for the source design.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone, or an Android/iOS simulator

## Install & Run

```bash
# From the repo root (monorepo uses npm workspaces)
npm install
npm run dev:mobile            # = expo start in apps/mobile
```

Then scan the QR code in Expo Go, or press `i` / `a` for iOS / Android simulator, or `w` for the web browser.

> `npm run build:mobile:web` produces `apps/mobile/dist/` for the GitHub Pages deploy.

## Structure

```
apps/mobile/
  App.js                        # Root: mode selector → caregiver / elder
  index.js                      # Entry
  metro.config.js               # Monorepo-aware Metro
  src/
    theme/tokens.js             # Design tokens (C.bg, C.teal, etc.)
    components/
      Icons.js                  # Shared SVG icons
      Pulse.js  Spin.js  Toggle.js  Chevron.js  FadeIn.js  RippleRings.js  RadialGlow.js
      TweaksPanel.js  TimeField.js  DateField.js
    context/TweaksContext.js    # Global reportStatus / accent / elderName
    services/mocks.js           # Mock backend (see docs/MOCKS.md)
    caregiver/
      CaregiverApp.js           # Shell with tab bar & overlays
      TabBar.js
      DashboardScreen.js        # 總覽
      HealthVitalsScreen.js     # 健康
      MedicationsScreen.js      # 藥物
      AppointmentsScreen.js     # 行程
      SettingsScreen.js         # 設定 (+ 4 sub-pages)
      NotificationsScreen.js    # 通知中心 + 詳情
      overlays/
        SOSOverlay.js
        PhoneCallOverlay.js
        MapLocationOverlay.js
    elder/
      ElderApp.js               # Shell
      ElderHome.js              # 主畫面 + 「我很好」
      ElderSOS.js               # 長按 3 秒觸發
      ElderMedication.js        # 拍照確認 (ready → camera → processing → done)
      ElderHealthInput.js       # 血壓 / 血糖 大按鈕輸入
      ElderAppointmentView.js   # 下次回診
```

## Demo controls

- **Mode selector** — choose 子女端 / 長輩端 on launch.
- **Caregiver top-right pill** — cycle `ok` / `warning` / `critical` to preview dashboard states.
- **Caregiver tab bar** — 總覽 / 健康 / 藥物 / 行程 / 設定.
- **Elder top-right pill** — switch to caregiver side.

## Notes

- Fonts: uses system default sans-serif. The prototype specifies `Noto Sans TC` + `Syne`; if needed they can be loaded via `expo-font`.
- Data is mock, held in each screen's local state (`useState`), per the original prototype.
- The iPhone "phone shell" wrapper from the HTML prototype is **not** reproduced — the app runs full-screen on the actual device.
- Absolute overlays (SOS, Phone, Map, Settings sub-pages, Notification detail) use `position: 'absolute'` within the screen root, matching the prototype's `zIndex` stacking.
