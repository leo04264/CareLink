# CLAUDE.md

專案級指令檔 — Claude Code 每次開啟工作階段時會讀取。請視為「給 AI 的 onboarding 文件」。

---

## Project

**CareLink** — 一款個人使用的長輩照護 App，讓子女能遠端關心、照顧年邁家人。

分兩個使用端：

- **子女端（主要開發重點）**：儀表板、通知、健康數值、服藥管理、回診行程、設定
- **長輩端**：超大字體、極簡操作 — 「我很好」每日回報、SOS、拍照確認服藥、手動量測

設計語言：**暗色系 / moody / 現代感**，全繁體中文 UI。

原始設計稿：`CareApp Prototype.html`（高擬真 HTML + React inline Babel 原型）。RN 版本必須逐像素對齊這份設計。

---

## Tech Stack

- **React Native 0.74 + Expo SDK 51**（iOS / Android / Web）
- **expo-linear-gradient** — 漸層背景
- **react-native-svg** — icon、圖表、radial gradient
- **@expo/vector-icons** — 系統圖示（多數自製 SVG）
- **@expo-google-fonts/noto-sans-tc** + **@expo-google-fonts/syne** — 字型
- **@react-native-community/slider** / **@react-native-community/datetimepicker**
- **No navigation library** — 目前用 `useState` 切畫面，符合原型
- **No state management library** — 各畫面 local state + `TweaksContext` 放全域 `reportStatus`
- **Target**：Expo Go 開發、GitHub Pages（web 匯出）自動部署

---

## File Structure

```
App.js                          Root — 模式選擇 → CaregiverApp / ElderApp
index.js                        Entry（含 @expo/metro-runtime for web）
app.json                        expo.experiments.baseUrl = "/CareLink"
.github/workflows/deploy.yml    push master → expo export web → Pages

src/
  theme/tokens.js               設計 token（C.bg, C.teal, FONT, numericFont）
  context/TweaksContext.js      reportStatus / accentColor / elderName 全域

  components/
    Icons.js                    自製 SVG icon pack
    Pulse.js    Spin.js         動畫 primitive
    Toggle.js   Chevron.js      控制項
    FadeIn.js   RippleRings.js  過場動畫
    RadialGlow.js               SVG 徑向光暈
    TweaksPanel.js              Debug / demo 面板
    TimeField.js  DateField.js  Native picker + web 文字 fallback

  caregiver/
    CaregiverApp.js             Shell + tab bar + overlays
    TabBar.js                   5 tabs: 總覽 / 健康 / 藥物 / 行程 / 設定
    DashboardScreen.js          狀態卡、鈴鐺 popover、活動、健康快照
    HealthVitalsScreen.js       血壓 / 血糖 7 天 SVG 圖 + 手動新增
    MedicationsScreen.js        週曆 + 展開藥物卡 + 漏服 banner + 新增
    AppointmentsScreen.js       月曆 + 回診卡 + 過去紀錄 + 新增抽屜
    SettingsScreen.js           + 4 sub-pages (Profile / Notif / Contacts / Location)
    NotificationsScreen.js      列表 + 詳情 overlay
    overlays/
      SOSOverlay.js             聯絡人通知 → 119 確認 → 撥打
      PhoneCallOverlay.js       Ringing → connected → 計時 → 掛斷
      MapLocationOverlay.js     假地圖 + 長輩 pin + 資訊卡

  elder/
    ElderApp.js                 Shell（home → 子畫面 via onBack）
    ElderHome.js                「我很好」大按鈕 + 快速動作 + SOS
    ElderSOS.js                 長按 3 秒 + 進度環 + 發送動畫
    ElderMedication.js          ready → camera → processing → done
    ElderHealthInput.js         血壓 / 血糖 大 +/− 按鈕，支援長按連打
    ElderAppointmentView.js     下次回診 + 其他行程
```

---

## Design Tokens

位於 `src/theme/tokens.js`。完整對應原型 `const C`：

- **Backgrounds**：`bg`, `surface`, `card`, `card2`
- **Borders**：`border`, `border2`
- **Text**：`text`, `text2`, `text3`
- **Semantic**：`teal` / `amber` / `red` / `green` / `blue` / `purple`（每個都有 `Dim` / `Glow` 變體）
- **Fonts**：`FONT.zh` (Noto Sans TC) / `FONT.num` (Syne)。數字、品牌字、計時器都用 `fontFamily: 'Syne_700Bold'`。

### 語意配色規則

| 情境 | 色系 |
|---|---|
| 一切正常 / 我很好 | teal |
| 藥物 / 警示 / 提醒 | amber |
| SOS / 錯誤 / 漏服 / 超時未回報 | red |
| 完成 / 成功 | green |
| 資訊 / 藍色藥物 | blue |
| 血壓 | purple |
| 血糖 | amber（#fcd34d） |

### 間距 / 圓角

- 間距：xs 4–6 / sm 8–10 / md 14–16 / lg 20–24 / xl 40+
- 圓角：小 8 / 按鈕 10–12 / 主卡 14–16 / 抽屜頂 20 / 圓形按鈕 50%

### 動畫時長

| 動作 | 時長 |
|---|---|
| Tap / toggle 回饋 | 150ms |
| Fade / slide 過場 | 200–300ms |
| Elder SOS 長按 | 3000ms（有進度環視覺） |
| Pulse（危急） | 1000ms |
| Pulse（警告） | 2000ms |

---

## Development

### Run locally

```bash
npm install
npm start                # expo start
# i / a / w → iOS / Android / Web
```

### Deploy

Push to `master` → `.github/workflows/deploy.yml` 會自動：

1. `npm ci`
2. `npx expo export --platform web`
3. Upload `dist/` → `actions/deploy-pages@v4`
4. 部署至 https://leo04264.github.io/CareLink/

**只要改 `app.json` 的 `experiments.baseUrl` 或 repo 改名，web 匯出路徑就會壞，記得同步。**

---

## Conventions

- **繁體中文 UI**，避免簡體混用
- **暗色系強制**，不提供淺色模式
- **iOS HIG**：子女端按鈕最小 44×44px；長輩端最小 76×76px
- **字體最小 15px**（長輩端）
- **fontFamily**：數字、時鐘、品牌 Logo 都用 `Syne_500Medium` / `Syne_700Bold`；其餘走系統預設（Noto Sans TC 已載入，但 RN 的預設會繼承）
- **Icon**：優先用 `src/components/Icons.js`（SVG），其次 emoji
- **State persistence**：目前 `useState`，未接 `AsyncStorage` / 後端
- **Navigation**：state-driven（`const [tab, setTab] = useState(...)`），不引入 react-navigation 除非必要

---

## Agent Workflow

本專案使用 5 個專門的 subagents 協同開發。定義檔在 `.claude/agents/`。

```
User request
  ↓
pm-feature-planner         （寫 spec、拆 task、訂驗收標準）
  ↓
rn-expo-implementer        （照著 task 寫 code，不擴張範圍）
  ↓
qa-test-runner             （跑 lint / typecheck / 手動檢查 flow）
  ↓                        （若 FAIL → 退回 implementer）
reality-checker            （逐條核對驗收標準，找證據，默認 NEEDS WORK）
  ↓                        （若 NEEDS WORK → 退回 implementer）
User review
```

**規則**：未經 `reality-checker` 標為 `READY FOR USER REVIEW`，任務都不算完成。

**Orchestration**：由 `workflow-orchestrator` 排程流程。一般情況下直接呼叫 orchestrator，讓它依序叫起其他 agent；也可單獨呼叫單一 agent 處理局部工作。

### 何時用哪個

| 情境 | Agent |
|---|---|
| 使用者有新功能想法，先不要動 code | `pm-feature-planner` |
| 已有明確 task + 驗收標準，要直接寫 code | `rn-expo-implementer` |
| 想在 commit 前把關程式碼品質 | `qa-test-runner` |
| 要判斷「這個真的能交給使用者了嗎」 | `reality-checker` |
| 多步驟、跨 agent 的完整功能流程 | `workflow-orchestrator` |

---

## Files Kept Around

- `CareApp Prototype.html` — 設計原型，**改 UI 前先比對這份**
- `README.md` — 原始 handoff 文件，含設計 spec、state shape、mock data
- `RUNNING.md` — 本地執行指南
- `CLAUDE.md` — 本文件
