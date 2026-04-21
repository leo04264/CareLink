# Handoff: CareApp — 長輩照護 App

## Overview

一款個人使用的長輩照護 App，讓子女能遠端關心、照顧年邁家人。分為兩個使用端：

- **子女端（主要開發重點）**：儀表板、通知、健康數值、服藥管理、回診行程、設定
- **長輩端**：超大字體、極簡操作，主要功能是「我很好」每日回報、SOS 緊急求救、拍照確認服藥、手動量測血壓/血糖

設計語言為 **暗色系 / moody / 現代感**，使用繁體中文。

---

## About the Design Files

本資料夾內的 `CareApp Prototype.html` 是**設計參考**，是以 HTML + React (inline Babel) 打造的高擬真互動原型，用來呈現期望的視覺與互動樣貌，**不是可直接上線的程式碼**。

你的任務是把這份 HTML 設計，搬到目標 codebase（React Native、Flutter、Next.js、SwiftUI…等你覺得最適合的框架）中**重新實作**，使用該環境既有的元件庫、路由、狀態管理與設計 token。

由於目前還沒有既有 codebase，建議的技術選型（個人使用、子女端為主）：

- **React Native + Expo**（iOS/Android 雙端）— 最適合，因本原型就是手機 UI
- 或 **Next.js (App Router) + Tailwind CSS + shadcn/ui** — 如果希望先做 PWA

以下視你選擇的框架套用既有 patterns。

---

## Fidelity

**High-fidelity (hifi)** — 像素級完整設計：
- 所有顏色、字體、間距、圓角、陰影、動畫都已定稿
- 互動流程完整（含空狀態、loading、確認流程）
- 資料為 mock，需接真實後端

實作時請**逐像素對齊**此 HTML 原型。

---

## Tech Stack Used in Prototype

| 項目 | 用法 |
|------|------|
| React 18.3.1 | inline Babel (`<script type="text/babel">`) |
| 字體 | `Noto Sans TC`（中文 UI）+ `Syne`（數字 / logo） |
| 狀態管理 | `useState` / `useRef` / `useEffect`（無 context） |
| 動畫 | inline CSS `@keyframes`（`fadeIn`, `slideUp`, `pulse`, `spin`） |
| 手機外框 | 自製 `PhoneShell` 元件模擬 iPhone 瀏海 + Home Indicator |

---

## App Structure & Navigation

### 模式切換
`App.jsx` 根據 `mode` state 切換兩端：

```
App
├── ModeSwitcher (右上切換按鈕) ── 可透過 Tweaks 面板切換
├── CaregiverApp (mode === 'caregiver')  ← 預設
└── ElderApp (mode === 'elder')
```

### 子女端（CaregiverApp）

5 tab 底部導航：

| Tab ID | 標籤 | 主要畫面 |
|---|---|---|
| `dashboard` | 總覽 | 長輩狀態卡、服藥進度、活動紀錄、健康數值、快速動作 |
| `health` | 健康 | 血壓 / 血糖 7 天折線+長條圖、統一紀錄、手動新增量測 |
| `medications` | 藥物 | 週曆、藥物卡片（展開/多時間開關/漏服警告/暫停狀態）、新增藥物 |
| `appointments` | 行程 | 月曆、即將到來回診卡、新增回診抽屜 |
| `settings` | 設定 | 4 個子頁：長輩資料、通知、緊急聯絡人、位置分享 |

**鈴鐺下拉通知**：在 Dashboard header 點鈴鐺會跳出 popover（最新 4 則），點「查看全部 →」切到完整通知頁 (`notifications`，不在 tab bar，從 dashboard 進入)。

**Overlay 層**（全螢幕模態）：
- `SOSOverlay` — SOS 二層確認（聯絡人清單 → 確認 119 → 撥打中）
- `PhoneCallOverlay` — 撥打電話介面
- `MapLocationOverlay` — 查看位置地圖

### 長輩端（ElderApp）

扁平結構，從 `ElderHome` 進入各子畫面：

- `ElderHome` — 主畫面：超大「我很好 ✓」按鈕 + SOS 長按紅色按鈕 + 4 個快速動作（服藥、血壓、血糖、回診）
- `ElderMedConfirm` — 服藥拍照確認流程（取景 → 快門 → AI 驗證 → 確認）
- `ElderHealthInput` — 血壓/血糖輸入（超大 +/- 按鈕）
- `ElderAppointment` — 今日 / 近期回診清單
- `SOSOverlay` — 與子女端共用

---

## Design Tokens

全部集中在原型檔案頂端的 `C` 常數。顏色體系：

### 色彩 (Colors)

```js
const C = {
  // Backgrounds
  bg:       '#05070a',           // 主背景（接近純黑）
  surface:  '#0d1017',           // 面板底色
  card:     'rgba(20,28,42,0.6)',    // 卡片底色
  card2:    'rgba(20,28,42,0.35)',   // 次級卡片
  border:   'rgba(255,255,255,0.06)',// 分隔線
  border2:  'rgba(255,255,255,0.12)',// 強分隔線

  // Text
  text:  '#fff',                   // 主要文字
  text2: 'rgba(255,255,255,0.65)', // 次要文字
  text3: 'rgba(255,255,255,0.4)',  // 弱化文字

  // Semantic colors
  teal:      '#14b8a6',  // 成功 / 正常 / 主色調
  tealDim:   'rgba(20,184,166,0.3)',
  tealGlow:  'rgba(20,184,166,0.1)',

  amber:     '#f59e0b',  // 提醒 / 警示 / 藥物
  amberDim:  'rgba(245,158,11,0.3)',
  amberGlow: 'rgba(245,158,11,0.1)',

  red:       '#ef4444',  // SOS / 緊急 / 錯誤
  redDim:    'rgba(239,68,68,0.3)',
  redGlow:   'rgba(239,68,68,0.1)',

  green:     '#22c55e',  // 完成 / 正常
  greenDim:  'rgba(34,197,94,0.3)',
  greenGlow: 'rgba(34,197,94,0.1)',

  blue:      '#3b82f6',  // 資訊 / 連結 / 血壓輔助
  blueDim:   'rgba(59,130,246,0.3)',
  blueGlow:  'rgba(59,130,246,0.1)',

  // Accent hues for per-item color coding
  purple:    '#a855f7',  // 血壓系
};
```

### 語意配色規則

| 情境 | 色系 |
|---|---|
| 一切正常 / 我很好 | teal |
| 藥物 / 警示 / 提醒 | amber |
| SOS / 錯誤 / 漏服 / 超時未回報 | red |
| 完成 / 成功 | green |
| 資訊 / 藍色藥物 / 鈣片 | blue |
| 血壓 | purple (#a855f7, #c084fc, #a78bfa) |
| 血糖 | amber (#fcd34d) |

### 字體 (Typography)

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;900&family=Syne:wght@500;700&display=swap');

body { font-family: 'Noto Sans TC', sans-serif; }
```

| 用途 | 字型 | 範例 |
|---|---|---|
| 所有中文 UI | `Noto Sans TC` | 介面標籤、內文、按鈕 |
| 數字、時間、logo | `Syne` | 血壓數值、時鐘、「CareLink」品牌字 |

**字級（子女端）**：標題 18px、卡片標題 14–15px、內文 12–13px、小字/標籤 10–11px。

**字級（長輩端）**：數字顯示 68–80px、標題 26–32px、按鈕 22–28px。**任何文字都不小於 15px**。

### 間距 (Spacing)

| Token | 值 | 使用 |
|---|---|---|
| xs | 4–6px | 圖示與文字間距 |
| sm | 8–10px | 卡片內 gap |
| md | 14–16px | 區塊邊距 padding |
| lg | 20–24px | Section 間距 |
| xl | 40px+ | 長輩端大按鈕周圍空間 |

### 圓角 (Border Radius)

- 8px — 小 chip、小圖示背景
- 10–12px — 按鈕、input、次級卡片
- 14–16px — 主要卡片
- 20px — 大按鈕、抽屜頂部
- 50% — 圓形圖示、大按鈕、頭像

### 陰影

基本上**不使用重陰影**（暗色系用 border + glow 取代）。唯一例外：Popover 用 `0 12px 32px rgba(0,0,0,0.55)`。

### 動畫

```css
@keyframes fadeIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
```

SOS 紅點、警示橫幅、危急狀態的所有動態元素都用 `pulse 1–2s infinite`。

---

## Screens / Views

### 1. 子女端 — Dashboard (`DashboardScreen`)

**目的**：一眼看懂長輩今日狀況。

**版面**（上到下）：
1. Critical/Warning Banner（只在異常狀態顯示）
2. Header：Logo `CareLink` + 鈴鐺（帶 badge 數字）+ 頭像「志」
3. 長輩狀態卡：頭像 + 姓名 + 狀態徽章（我很好/尚未回報/失聯警示）+ 3 欄統計（回報時間、今日步數、服藥狀況）
4. 快速動作 3 格按鈕：撥打電話 / 查看位置 / 觸發 SOS（測試用）
5. 今日服藥進度卡：3 個時段 + ✓/待 狀態 chip
6. 最新活動列表：時間軸 + 圖示 + 標題/副標
7. 健康數值迷你圖：血壓 + 血糖（點擊切到健康分頁）

**關鍵狀態**（由 Tweaks 控制）：
- `reportStatus: 'ok' | 'warning' | 'critical'` — 三種狀態會讓所有元素變色（狀態徽章、頭像表情、卡片邊框、警示橫幅、鈴鐺 badge 等）

### 2. 子女端 — 鈴鐺通知下拉（在 Dashboard 內）

點 Dashboard 右上鈴鐺 → 300px 寬 popover 從右滑下。

- 箭頭指向鈴鐺
- 最多顯示 4 則通知（SOS/警告/藥物/健康/回報）
- 每則有 icon 背景色 chip + 標題 + 副標（單行截斷）+ 時間
- SOS 通知右側有脈動紅點
- 底部「查看全部通知 →」全寬按鈕 → 切換 tab 到 `notifications`
- 點背景或 X 關閉

### 3. 子女端 — Notifications（完整通知頁）

`NotificationsScreen` — 不在 tab bar，從鈴鐺下拉進入。

- 頂部「通知中心」+「全部清除」按鈕
- 卡片列表：每則有類型色邊框、圖示點、標題、內文、時間、關閉按鈕、`›` 右箭頭
- 點擊卡片 → 滑入全頁 `NotifDetail` 詳情：類型圖示、完整文字、metadata（時間/裝置/狀態）、依類型顯示操作按鈕（撥打/標記已服用/回覆/查看紀錄）

### 4. 子女端 — Health (`HealthVitalsScreen`)

- 血壓卡（紫）+ 血糖卡（琥珀），各含：
  - 當前值大數字 + 狀態徽章
  - 7 天折線圖（SVG）
  - 7 天長條圖
  - 參考範圍說明
- 下方「統一紀錄表」：時間 + 類型 + 值 + 備註
- 右上「手動新增」按鈕 → 底部滑出抽屜：切換血壓/血糖、輸入欄、情境 chip（血糖）、儲存

### 5. 子女端 — Medications (`MedicationsScreen`)

- Header：「服藥管理」+ 副標「張秀蘭・目前 N 種藥物」+「+ 新增藥物」按鈕
- 漏服橫幅（只在有漏服時）：紅色警示「今日有 N 種藥物漏服！」
- 摘要 3 格：目前藥物 / 每日提醒次 / 本週服藥率
- 週曆 7 天（可點選日期切換檢視，今天藍點，完成綠點）
- 藥物卡列表：
  - Head：色條 + 藥物 icon + 名稱 + 啟用徽章 + 劑量文字 + 展開箭頭
  - 展開內容：
    - 今日服藥狀況：早/中/晚圓點（✓綠、✕紅、—灰）
    - 漏服警告框（若有）
    - 提醒時間列表：每行時間 + 餐別 + 開關 switch + 刪除 ✕
    - 備註框（一般琥珀 / 漏服紅色）
    - 操作按鈕：暫停提醒 / 刪除
  - **暫停狀態特殊視覺**：整卡 55% 透明、灰色色條、名稱後加「（暫停）」、展開顯示暫停原因、按鈕變「▶ 恢復提醒」
- 新增藥物抽屜：名稱 * / 劑量 / 提醒時間 / 顏色選擇（6 色圓 chip）/ 備註 / 取消 + 新增按鈕

### 6. 子女端 — Appointments (`AppointmentsScreen`)

- 可切換月份的迷你月曆（有回診日期顯示橙點、今天藍框、點選日期高亮）
- 即將到來的回診卡片：橙/藍/綠急迫色條 + 醫院 + 科別 + 時間 + 地點 + 「標為完成」「刪除」
- 右上「+ 新增」→ 底部抽屜：標題 / 日期 / 時間 / 醫院 / 科別 / 備註

### 7. 子女端 — Settings (`SettingsScreen`)

主頁列出 4 個分組：

- **個人**：切換長輩模式 / 帳號管理
- **長輩**：長輩資料（→ `SubElderProfile`）
- **通知與警示**：通知設定（→ `SubNotifications`）/ 緊急聯絡人（→ `SubEmergencyContacts`）/ 位置分享（→ `SubLocation`）
- **其他**：關於 / 登出

每個子頁都用 `SettingSubPage` 包裝（統一 header + 返回按鈕）。

#### SubEmergencyContacts（緊急聯絡人）
- 3–4 位聯絡人卡片：頭像 + 姓名 + 關係 + 電話 + 通知順序徽章 + 開關
- 新增聯絡人按鈕
- **紅色提示框**：「119 緊急救援需額外確認才會撥打，不會自動通知」

#### SubLocation（位置分享）
- 即時位置分享 toggle + 地理圍欄 toggle
- 警示範圍 slider（0.5–5 km）
- 共享對象清單（家人 toggle）

#### SubNotifications（通知設定）
- 總開關
- 各類通知分別 toggle：SOS、藥物未服、漏回報、健康數值異常、回診提醒
- 勿擾模式時段

### 8. 長輩端 — Home (`ElderHome`)

**極簡佈局**，所有元素都超大：

- 頂部：日期 + 問候語（大字）
- **主要按鈕**：「我很好 ✓」圓形大按鈕（約 240×240，teal 色），佔螢幕中央顯眼位置
- 按下 → 全螢幕確認動畫「已通知家人」
- **SOS 按鈕**：紅色小圓按鈕在右下角，**需長按 2 秒**觸發（防誤按），含進度環動畫
- 4 個快速動作按鈕：服藥 / 血壓 / 血糖 / 回診（各 80–100px 圓角方塊）

### 9. 長輩端 — 服藥拍照確認 (`ElderMedConfirm`)

流程：
1. 說明頁（要吃什麼藥）→ 「拍照確認服藥」大按鈕（也可跳過）
2. 相機取景畫面（角落定位框、掃描動畫）→ 快門按鈕
3. 白光閃爍 → AI 驗證轉圈（2 秒）
4. 完成頁：縮圖 + 「✓ 已通知家人」+ 返回主頁

### 10. 長輩端 — 血壓/血糖輸入 (`ElderHealthInput`)

**不需滾動**即可完成。

- 頂部：返回按鈕 + 狀態徽章（正常/注意/偏高/過高，隨數值動態變色）
- Tab 切換：🩺 血壓 / 🩸 血糖（大 tab，53px 高）
- **血壓**（水平兩欄）：
  - 收縮壓 | / | 舒張壓 並排
  - 每欄上下堆疊：標籤 / + 按鈕 / 68–76px 大數字 / − 按鈕
  - +/- 按鈕 58px 圓形，支援**長按連續調整**
- **血糖**（垂直置中）：
  - 情境 3 chip：空腹 / 餐後 / 睡前（52px 高）
  - 上 + 大按鈕 / 80px 大數字 / 下 − 大按鈕
  - 正常範圍指示條（漸層 bar + 游標位置）
- 確認按鈕佔全寬（20px padding、22px 粗字），按下變綠「✓ 已記錄，通知家人！」

### 11. SOS Overlay（兩端共用）

**子女端**（`SOSOverlay`）：
1. 觸發後自動依序通知家人（動畫：每位聯絡人頭像 → ✓ 已通知）
2. 所有人通知完成後，出現「是否通報 119？」確認卡
3. 每位聯絡人旁有開關可關閉
4. 可「+ 新增自訂聯絡人」
5. 確認 → 撥打 119 畫面（紅色擴散動畫）/ 取消 → 關閉

### 12. 電話 Overlay (`PhoneCallOverlay`)

全螢幕、模擬 iPhone 撥號：
- 模糊背景頭像
- 姓名 + 號碼
- 撥號中（2.8 秒）→ 自動接通 + 計時器
- 底部 6 按鈕：靜音 / 鍵盤 / 擴音 / 加人 / FaceTime / 通訊錄
- 紅色掛斷大按鈕

### 13. 地圖 Overlay (`MapLocationOverlay`)

- 假地圖背景（網格 + 路）
- 長輩位置 pin（脈動光環）
- 底部資訊卡：地址 + 距離 + 最後更新時間 + 導航/訊息按鈕

---

## Interactions & Behavior

### 動畫時長
- 快速反饋（tap, toggle）：`0.15s ease`
- 一般過場（fade, slide）：`0.2–0.3s`
- 長按 SOS：2000ms（有進度環視覺）
- Pulse（危急狀態）：1s infinite
- Pulse（警告狀態）：2s infinite

### 長按 (Press-and-hold)
- SOS 按鈕：2 秒，需持續按壓，放開即取消
- +/- 數值按鈕：首次即觸發，之後每 120ms 重複（`setInterval`）

### Toggle 行為
- 所有開關均為即時生效（不需 save）
- 綠色為「開」，灰色為「關」

### Navigation
- 子女端：底部 5 tab（state 驅動，非 route）
- 長輩端：ElderHome 為 root，子畫面用 `onBack` callback 回去
- 子頁（設定）：絕對定位覆蓋，用 `position:absolute;inset:0;zIndex:150`

### Persistence
- 目前原型用 `useState`，重整即丟失
- 正式版應用 `AsyncStorage` / `localStorage` / 後端 API
- 關鍵資料：藥物清單、聯絡人、回診、健康數值、設定偏好

---

## State Management

### 關鍵 State Shape

```ts
// App 層
interface AppState {
  mode: 'caregiver' | 'elder';
  tweaks: {
    reportStatus: 'ok' | 'warning' | 'critical';
    // ...其他 Tweak keys
  };
}

// 長輩資料
interface Elder {
  name: string;
  age: number;
  relation: string;  // 媽媽 / 爸爸 / 奶奶 / 爺爺 / 其他
  avatar?: string;
  lastReport: Date | null;
  todaySteps: number;
  medsDoneToday: number;
  medsTotalToday: number;
}

// 藥物
interface Medication {
  id: string;
  name: string;
  dose: string;      // '1 顆'、'500mg'
  slots: Array<{
    time: string;    // 'HH:MM'
    meal: string;    // '早餐後・500mg'
    on: boolean;
  }>;
  note: string;
  color: string;     // hex
  active: boolean;
  missedToday?: boolean;
  pauseReason?: string;
}

// 健康紀錄
interface VitalRecord {
  id: string;
  type: 'bp' | 'bs';
  at: Date;
  // 血壓
  sys?: number; dia?: number;
  // 血糖
  bs?: number; ctx?: 'pre' | 'post' | 'bed';
  source: 'elder_manual' | 'caregiver_manual' | 'device';
  note?: string;
}

// 回診
interface Appointment {
  id: string;
  title: string;
  date: Date;
  hospital: string;
  department: string;
  location: string;
  note: string;
  urgency: 'high' | 'mid' | 'low'; // 決定色條
  done: boolean;
}

// 緊急聯絡人
interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  order: number;       // 1, 2, 3... 通知順序
  enabled: boolean;
}

// 通知
interface NotificationItem {
  id: string;
  type: 'sos' | 'med' | 'health' | 'ok' | 'warn';
  title: string;
  body: string;
  time: Date;
  read: boolean;
  urgent?: boolean;
  meta?: Record<string, any>;
}
```

### 狀態流轉

- `reportStatus` 由「最後回報時間」計算：
  - 今日已回報 → `ok`
  - 超過 4 小時未回報 → `warning`
  - 超過 24 小時未回報 → `critical`
- 長輩按「我很好」→ 更新 lastReport → caregiver 端狀態自動變 `ok`
- 長輩按 SOS（長按 2 秒）→ 產生 `sos` notification → 依 EmergencyContact.order 依序推播 → 可選通報 119

---

## Responsive / Platform Notes

### 目標尺寸
原型設計為 **iPhone 14 Pro (390×844)**。手機外框以 720px 高做設計基準。

### 安全區域
- 頂部瀏海：44px 高 (status bar) + 可見瀏海凹槽
- 底部 Home Indicator：34px

### 暗色模式
整個 App 強制暗色，**不提供淺色模式**。

### 觸控目標
- 所有按鈕最小 44×44px（iOS HIG）
- 長輩端按鈕最小 76×76px

### 字體載入
Google Fonts Noto Sans TC + Syne。若目標平台需離線，建議下載為 local font。

---

## Mock Data

原型裡用的假資料：

- 長輩：**媽媽／張秀蘭／75 歲**
- 子女：**志明**
- 藥物 4 項：降血壓藥（脈優錠）、鈣片、Metformin 二甲雙胍（今日漏服）、阿斯匹靈（暫停）
- 聯絡人：大哥 志明 / 二姊 美玲 / 小弟 建宏

正式版需替換為真實資料，或提供初始化設定流程。

---

## Assets

本原型**不使用**外部圖片、icon 包。所有 icon 皆為：
- Inline SVG（自製）
- Unicode Emoji（👵 🩺 🩸 💊 ✓ ⚠️ 🚨 📍 ❚❚ ▶ 🗑）

在生產環境建議：
- 替換 emoji 為 icon 庫（`lucide-react`、`@expo/vector-icons`、SF Symbols）
- 長輩頭像應為可上傳照片

---

## Development Priorities (Suggested)

建議實作順序：

### Phase 1 — MVP
1. 長輩端 ElderHome + 「我很好」回報
2. 子女端 Dashboard + 狀態卡（只需 `reportStatus`）
3. 推播機制（Firebase / APNs）

### Phase 2 — 核心功能
4. 藥物管理 CRUD + 每日提醒 notification
5. 長輩端服藥拍照確認（含相機權限）
6. SOS 流程 + 緊急聯絡人 + 二層確認

### Phase 3 — 健康 & 行程
7. 血壓/血糖手動輸入（長輩端大按鈕版 + 子女端）
8. 7 天趨勢圖
9. 回診行程 + 月曆

### Phase 4 — 打磨
10. 通知中心 + 鈴鐺下拉
11. 設定子頁（位置分享、地理圍欄）
12. 撥打電話 / 查看位置 overlay（整合 Linking API + 地圖 SDK）

---

## Files in This Handoff

| 檔案 | 說明 |
|---|---|
| `CareApp Prototype.html` | **唯一設計原型檔** — 用瀏覽器開啟即可看到完整互動。所有元件、styles、mock data 都在這裡。 |
| `README.md` | 本文件 |

### 如何閱讀原型原始碼

在 HTML 內搜尋這些關鍵字即可跳到對應元件：
- `function DashboardScreen` — 子女端總覽
- `function NotificationsScreen` / `NotifDetail` — 通知
- `function MedicationsScreen` — 藥物
- `function HealthVitalsScreen` — 健康
- `function AppointmentsScreen` — 行程
- `function SettingsScreen` / `SubElderProfile` / `SubEmergencyContacts` / `SubLocation` / `SubNotifications`
- `function ElderHome` — 長輩主畫面
- `function ElderHealthInput` — 血壓/血糖輸入
- `function ElderMedConfirm` — 拍照確認
- `function SOSOverlay` / `PhoneCallOverlay` / `MapLocationOverlay`
- `const C = {` — 所有設計 token

---

## Questions to Resolve Before Coding

- [ ] 使用者帳號：要不要多子女共享？若是，如何權限管理？
- [ ] 後端技術選型：Firebase / Supabase / 自建？
- [ ] 推播：Firebase Cloud Messaging 還是原生 APNs/FCM？
- [ ] 地圖：Google Maps / Apple Maps / Mapbox？
- [ ] 拍照驗證是否真的要跑 AI？還是單純留存照片讓子女查看？
- [ ] SOS 真的撥 119 或只是顯示號碼讓使用者確認撥打？（法規考量）
- [ ] 長輩端是否需要單獨 app，還是同一 app 透過模式切換？
