# MOCKS.md — 上線前必換清單

**每個 mock 都記在這裡。** 正式上線前，逐條確認已經換成真實實作，並把「狀態」欄位改成 ✅。

所有 mock 都住在 `src/services/mocks.js`，透過 `[MOCK]` log 前綴 + 跳出 alert（針對有副作用的動作）讓開發/demo 時一眼看出哪裡是假的。

---

## ⚠️ Demo 前必須決定：後端部署方案

**目前狀態**：`apps/api/` 只在本機跑 (`npm run dev:api`)。Mobile 還是全部走 mocks，沒有實際打 API。

要給家人或任何人 demo 之前，必須做其中一個：

| 選項 | 月費 | 何時選它 |
|---|---|---|
| **Render Free + Neon + Upstash** | $0 | 只想讓人試一下，能接受 15 分鐘閒置睡眠、冷啟 20s、BullMQ 排程會錯過 |
| **Fly.io**（付費）| ~$5 | 要穩定運作 + 排程準時，不想管 Linux |
| **Hetzner VPS**（付費）| ~$4 | 同樣 $5 等級但完全自己掌控，要會 Linux |
| **Oracle Cloud Always Free** | $0 | 想要真的免費 + 排程穩，願意忍受註冊麻煩 |

決定後：
1. 寫 `apps/api/Dockerfile` + 對應平台設定（`fly.toml` / `render.yaml` / 直接 docker-compose）
2. 新增 `.github/workflows/deploy-api.yml` 或手動 deploy runbook
3. 把 `apps/mobile/src/services/api.ts` 的 `API_URL` 指向新後端
4. 開始把下表的 mock 逐條換成真 API 呼叫

---

## 圖例

| 分類 | 說明 |
|---|---|
| 🔴 | 需要後端 API |
| 🟣 | 需要原生能力（`Linking`, `expo-camera`, `expo-location`…） |
| 🟡 | 僅需持久化（`AsyncStorage` / SQLite） |
| 🟢 | 需要外部服務（FCM、AWS S3、語音辨識…） |

---

## 清單

| # | 功能 | 檔案 / 函式 | 類別 | 狀態 | 上線實作 |
|---|---|---|---|---|---|
| 1 | **撥打 119** | `mocks.call119()` | 🟣 | ⬜ | `Linking.openURL('tel:119')`；iOS Info.plist 需加 `tel:*` 到 `LSApplicationQueriesSchemes`；web 用 `window.location.href = 'tel:119'`；建議保留二次確認流程（法規考量） |
| 2 | **撥打家人電話** | `mocks.dial(number)` | 🟣 | ⬜ | 同上，改用 `tel:${number}` |
| 3 | **SOS 廣播通知** | `mocks.broadcastSOS()` | 🔴🟢 | ⬜ | POST `/api/emergency/sos` → 後端扇出 FCM push；失敗 fallback SMS；再失敗 fallback 撥號；串流 ACK 回前端 |
| 4 | **「我很好」每日回報** | `mocks.reportOK()` | 🔴 | ⬜ | POST `/api/elders/:id/report`；後端寫入 `last_report_at`，推播給所有訂閱此長輩的 caregiver |
| 5 | **血壓/血糖量測儲存** | `mocks.recordVital()` | 🔴🟡 | ⬜ | POST `/api/vitals`；本地同步寫 AsyncStorage 保證斷網可用；背景 retry |
| 6 | **拉取 7 天 vitals 趨勢** | `mocks.fetchVitals()` | 🔴 | ⬜ | GET `/api/vitals?from=...&to=...&type=bp\|bs`；前端自己切 7 天視窗 |
| 7 | **服藥拍照 + AI 驗證** | `mocks.confirmMedDose()` | 🔴🟢🟣 | ⬜ | `expo-camera` 拍照 → 上傳 S3 / Firebase Storage → 後端跑視覺模型（藥丸辨識、顆數點算）→ 寫 `med_dose_log` → 推播 caregiver |
| 8 | **回診行程 CRUD** | `mocks.createAppointment / updateAppointment / deleteAppointment` | 🔴🟡 | ⬜ | REST `/api/appointments`；本地 AsyncStorage 鏡像；提前提醒用 `expo-notifications` scheduled notification |
| 9 | **緊急聯絡人 CRUD** | `mocks.saveContact / deleteContact` | 🔴 | ⬜ | REST `/api/contacts`；與 SOS 服務共用 |
| 10 | **長輩位置查詢** | `mocks.fetchElderLocation()` | 🔴🟣 | ⬜ | 長輩端用 `expo-location` `watchPositionAsync` 上傳；caregiver 端 WebSocket 訂閱；無網路時用 last-known |
| 11 | **地理圍欄設定** | `mocks.setGeofence()` | 🔴🟣 | ⬜ | 存後端；長輩端背景跑 geofencing（iOS `CLCircularRegion`、Android `GeofencingClient`）；越界時本地先發推播再上報 |
| 12 | **通知中心列表** | `mocks.fetchNotifications()` | 🔴🟢 | ⬜ | GET `/api/notifications`；FCM / APNs 處理 push；WebSocket/SSE 處理 live |
| 13 | **通知已讀 / 清除** | `mocks.markNotificationRead / dismissNotification` | 🔴 | ⬜ | PATCH / DELETE `/api/notifications/:id` |
| 14 | **長輩 Profile 儲存** | `mocks.saveElderProfile()` | 🔴 | ⬜ | PATCH `/api/elders/:id` |
| 15 | **通知設定儲存** | `mocks.saveNotificationSettings()` | 🔴🟡 | ⬜ | PATCH `/api/users/me/notification-prefs`；鏡像到 AsyncStorage |
| 16 | **位置分享設定** | `mocks.saveLocationSettings()` | 🔴🟡 | ⬜ | PATCH `/api/users/me/location-prefs` |

---

## 上線 checklist（開發前 / 開發中 / 上線前）

### 🚨 Demo 前必做（目前最大的 blocker）
- [ ] **選定後端部署方案**（見本文件最上方「⚠️ Demo 前必須決定」一段）
- [ ] 寫 `Dockerfile` + 平台設定（`fly.toml` / `render.yaml` / docker-compose）
- [ ] 部署 `apps/api` 到雲上，確認 `https://<domain>/health` 能通
- [ ] 建立 `apps/mobile/src/services/api.ts`，把 `API_URL` 指向雲端後端
- [ ] 把 `mocks.reportOK()` 換成真打 `POST /api/elders/:id/report`（第一個 end-to-end 測試）

### 技術選型（開發前決定）
- [ ] 後端：Firebase / Supabase / 自建 Node + Postgres？
- [ ] 推播：FCM（跨平台）or 原生 APNs + FCM 分別接？
- [ ] 儲存：RDBMS + S3 for photos，還是純 Firebase？
- [ ] 身分驗證：Google / Apple Sign-In + phone OTP？
- [ ] 地圖：Google Maps / Apple Maps / Mapbox？

### 原生整合（開發中）
- [ ] `expo-location` 權限 + 背景定位（iOS UIBackgroundModes）
- [ ] `expo-camera` + `expo-media-library` 權限
- [ ] `expo-notifications` 註冊 push token、排程提醒
- [ ] iOS Info.plist `LSApplicationQueriesSchemes` 加 `tel`, `telprompt`
- [ ] Android `AndroidManifest.xml` queries for `tel:*` intent

### 法規 / UX（上線前）
- [ ] 119 撥打二次確認流程（避免誤觸），並在設定中明示「本 App 不代替報案」
- [ ] 拍照服藥的隱私說明：照片上傳、保存期限、誰看得到
- [ ] 位置分享的同意流程：長輩端要明確同意，且能隨時撤回
- [ ] 緊急聯絡人須是註冊用戶（不然 SOS 推播無處可去），或提供 SMS fallback 要有服務商
- [ ] App Store / Play Store 描述中清楚標示「非醫療器材」、「不代替 119」

### QA（上線前）
- [ ] MOCKS.md 全部項目狀態為 ✅
- [ ] 一整天的端到端測試：長輩按「我很好」→ caregiver 儀表板看到；SOS → 聯絡人收到；拍照 → caregiver 看到
- [ ] 斷網 → 重連：`recordVital` / `reportOK` 會補送
- [ ] 推播在 iOS / Android 雙端都能喚起 App

---

## 如何確認 mock 仍在運作

開發時 console 會看到 `[MOCK]` 前綴：

```
[MOCK] reportOK lastReport = 2026-04-22T...
[MOCK] broadcastSOS { elderName: '媽媽', contactCount: 3 }
[MOCK] call119 would dial tel:119
```

有副作用的動作（119、撥電話）會跳 `[MOCK] 假撥打...` 的 alert。正式上線時把這兩處移除即可（或保留供 dev build 使用）。

---

## 相關檔案

- `src/services/mocks.js` — 所有 mock 實作
- `CLAUDE.md` — 專案 onboarding
- `README.md` — 功能規格
- `CareApp Prototype.html` — 設計原型
