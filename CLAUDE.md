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

本 repo 採 **npm workspaces monorepo**。

```
carelink/
├── apps/
│   └── mobile/                    React Native + Expo (前端)
│       ├── App.js                 Root — 模式選擇 → CaregiverApp / ElderApp
│       ├── index.js               Entry（含 @expo/metro-runtime for web）
│       ├── app.json               expo.experiments.baseUrl = "/CareLink"
│       ├── metro.config.js        Monorepo-aware Metro 設定
│       └── src/
│           ├── theme/tokens.js            設計 token（C.bg, C.teal, FONT）
│           ├── context/TweaksContext.js   reportStatus / accentColor 全域
│           ├── services/mocks.js          後端 mock (見 docs/MOCKS.md)
│           ├── components/
│           │   ├── Icons.js               自製 SVG icon pack
│           │   ├── Pulse.js Spin.js       動畫 primitive
│           │   ├── Toggle.js Chevron.js   控制項
│           │   ├── FadeIn.js RippleRings.js 過場動畫
│           │   ├── RadialGlow.js          SVG 徑向光暈
│           │   ├── TweaksPanel.js         Debug / demo 面板
│           │   └── TimeField.js DateField.js Native picker + web fallback
│           ├── caregiver/
│           │   ├── CaregiverApp.js        Shell + tab bar + overlays
│           │   ├── TabBar.js              5 tabs
│           │   ├── DashboardScreen.js
│           │   ├── HealthVitalsScreen.js
│           │   ├── MedicationsScreen.js
│           │   ├── AppointmentsScreen.js
│           │   ├── SettingsScreen.js      + 4 sub-pages
│           │   ├── NotificationsScreen.js
│           │   └── overlays/
│           │       ├── SOSOverlay.js
│           │       ├── PhoneCallOverlay.js
│           │       └── MapLocationOverlay.js
│           └── elder/
│               ├── ElderApp.js
│               ├── ElderHome.js           「我很好」大按鈕 + 快速動作 + SOS
│               ├── ElderSOS.js            長按 3 秒 + 進度環
│               ├── ElderMedication.js     ready → camera → processing → done
│               ├── ElderHealthInput.js    血壓 / 血糖 大 +/− 按鈕
│               └── ElderAppointmentView.js
│   │
│   └── api/                       Fastify + TypeScript 後端（PR B 起）
│       ├── src/
│       │   ├── app.ts             Fastify factory (cors + rate-limit + errors)
│       │   ├── server.ts          Boot entry
│       │   ├── plugins/
│       │   │   └── error-handler.ts   ApiException / ZodError → ApiError envelope
│       │   └── modules/
│       │       └── health/health.routes.ts   GET /health
│       ├── .env.example
│       ├── package.json           @carelink/api
│       └── tsconfig.json
│
├── packages/
│   └── shared/                    @carelink/shared — TS 型別 + 錯誤碼
│       └── src/
│           ├── index.ts           re-exports
│           ├── enums.ts           ReportStatus / VitalType / NotificationType …
│           ├── models.ts          Elder / Medication / VitalRecord / Appointment
│           ├── api.ts             ApiSuccess / ApiError / CursorPage
│           └── errors.ts          ErrorCodes + DefaultHttpStatus (對應 spec §10)
│
├── infra/
│   ├── docker-compose.dev.yml    Postgres 16 + Redis 7（本地開發）
│   └── README.md
│
├── spec/
│   └── carelink-backend-spec.md  後端規格
├── docs/
│   ├── MOCKS.md                  上線前要換的 mock 清單
│   └── RUNNING.md                本地開發指南
├── .github/workflows/
│   ├── deploy-web.yml            push master (apps/mobile/**) → Pages
│   └── (deploy-api.yml 計畫中 — PR C)
├── .claude/agents/               5 個專門 subagent 定義
├── CLAUDE.md                     本文件
├── README.md                     Handoff 規格
├── CareApp Prototype.html        設計原型
├── tsconfig.base.json            workspace 共用的 TS compilerOptions
├── package.json                  workspaces root — scripts 轉到 apps/* / packages/*
└── package-lock.json             整個 monorepo 共用一份 lockfile
```

### 後端指令

```bash
npm run infra:up         # docker compose up -d (postgres + redis)
npm run dev:api          # tsx watch apps/api/src/server.ts
npm run build:api        # tsc → apps/api/dist
npm run typecheck        # @carelink/shared + @carelink/api
```

### 後端目前的部署狀態

**尚未上雲，只在本機跑。** Mobile 還是全部走 `apps/mobile/src/services/mocks.js`。

要給任何人 demo 之前必須：
1. 選定部署平台（Render free / Fly paid / Hetzner / Oracle Always Free — 見 [`docs/MOCKS.md`](docs/MOCKS.md)）
2. 寫 Dockerfile + CI workflow
3. Mobile 加上 `services/api.ts` 指向雲端後端
4. 逐條把 `mocks.js` 換成真實 API 呼叫

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
# 第一次：在 root 安裝整個 monorepo
npm install

# 啟前端
npm run dev:mobile          # = expo start (inside apps/mobile)
# 啟動後按 i / a / w → iOS / Android / Web

# 直接跑 web export (debug deploy 用)
npm run build:mobile:web    # = expo export --platform web
# 輸出到 apps/mobile/dist/
```

### Deploy

Push to `master` 且有動到 `apps/mobile/**` / `packages/**` / root `package*.json` → `.github/workflows/deploy-web.yml` 會自動：

1. `npm ci` （root）
2. `npm run build:mobile:web` （= `npm -w apps/mobile run export:web`）
3. Upload `apps/mobile/dist/` → `actions/deploy-pages@v4`
4. 部署至 https://leo04264.github.io/CareLink/

**只要改 `apps/mobile/app.json` 的 `experiments.baseUrl` 或 repo 改名，web 匯出路徑就會壞，記得同步。**

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

本專案使用 **需求驅動的閉環流程**：User 只提需求，其餘由 4 個專門 subagent +
1 個協調者處理。定義檔在 `.claude/agents/` 和 `.claude/skills/`。

### 入口

- **`/feature <需求>`** — 新功能請求的**唯一入口**。觸發完整管線。（定義於 `.claude/skills/feature-dev.md`）
- **`/refine <修改>`** — 對 spec 或結果要求改動時用，回到 PM 再跑一輪。（定義於 `.claude/skills/refine-spec.md`）

### 管線

```
User: /feature <需求>
      │
      ▼
pm-feature-planner → 產出 spec
      │
      ▼
  ╔═══════════════════════════════╗
  ║ GATE 1：User 確認 spec          ║ ← 強制，不能略過
  ║  ├── 同意 → 進 impl            ║
  ║  └── /refine <修改> → 回 PM    ║
  ╚═══════════════════════════════╝
      │
      ▼
rn-expo-implementer → 寫 code
      │
      ▼
qa-test-runner（lint / typecheck / 靜態走查）
      │
      ├── FAIL → 回 implementer（自動，最多 3 輪後升級 user）
      │
      ▼
reality-checker → 證據收集（**不做決策**，只把每條 acceptance criterion 的證據攤給 user）
      │
      ▼
  ╔═══════════════════════════════╗
  ║ GATE 2：User 終驗收             ║ ← 強制
  ║  ├── 同意 → 任務完成           ║
  ║  ├── /refine <修改> → 回 PM    ║
  ║  └── 指定小修 → 回 implementer ║
  ╚═══════════════════════════════╝
```

### 兩條核心規則

1. **Gate 1 / Gate 2 都是強制的** — AI 不能替 user 決定跳過。
2. **最終決策者是 user**，不是 reality-checker。reality-checker 的責任是把證據準備好讓 user 判斷，不是宣告「可以放行」。

### 何時用哪個

| 情境 | 入口 |
|---|---|
| 新功能想法 | `/feature <需求>` |
| 對目前 spec 或結果想改 | `/refine <修改>` |
| 想針對某個局部直接呼叫單一 agent（小修、偵錯） | 直接 `Agent(subagent_type=...)` |
| 多步驟、完整 pipeline | `/feature` 內部已經叫 `workflow-orchestrator` 處理 |

---

## Files Kept Around

- `CareApp Prototype.html` — 設計原型，**改 UI 前先比對這份**
- `README.md` — 原始 handoff 文件，含設計 spec、state shape、mock data
- `spec/carelink-backend-spec.md` — 後端開發規格（Fastify + Postgres + BullMQ）
- `docs/RUNNING.md` — 本地執行指南
- `docs/MOCKS.md` — mock service 清單，上線前逐條替換成真實後端
- `CLAUDE.md` — 本文件
