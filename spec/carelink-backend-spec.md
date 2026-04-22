# CareLink — 後端開發規格文件

**版本：** v1.0  
**技術棧：** Node.js + Fastify + TypeScript  
**前端：** React Native + Expo  
**最後更新：** 2026-04-22

---

## 目錄

1. [專案架構建議](#1-專案架構建議)
2. [技術棧總覽](#2-技術棧總覽)
3. [環境變數](#3-環境變數)
4. [資料庫 Schema](#4-資料庫-schema)
5. [API 規格](#5-api-規格)
6. [背景排程與佇列](#6-背景排程與佇列)
7. [推播通知](#7-推播通知)
8. [圖片上傳 (Cloudflare R2)](#8-圖片上傳-cloudflare-r2)
9. [認證機制](#9-認證機制)
10. [錯誤代碼規範](#10-錯誤代碼規範)
11. [前後端整合建議](#11-前後端整合建議)

---

## 1. 專案架構建議

### 1.1 Repo 策略：Monorepo（推薦）

```
carelink/
├── apps/
│   ├── mobile/          # React Native + Expo（前端）
│   └── api/             # Fastify 後端
├── packages/
│   └── shared/          # 共用 TypeScript 型別、常數
│       ├── types/
│       │   ├── api.ts       # Request / Response 型別
│       │   ├── models.ts    # 資料模型型別
│       │   └── enums.ts     # 共用列舉
│       └── constants/
│           ├── errors.ts    # 錯誤代碼
│           └── config.ts    # 共用常數
├── package.json         # workspace root
└── turbo.json           # Turborepo 設定（可選）
```

**優點：**
- `packages/shared` 的型別前後端共用，API 介面不會對不上
- 一個 repo 管理，Pull Request 可以同時改前後端
- Turborepo 可以平行建置，加速 CI/CD

### 1.2 後端目錄結構

```
apps/api/
├── src/
│   ├── plugins/             # Fastify plugins（auth、cors、rate-limit）
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   ├── family/
│   │   ├── elder/
│   │   ├── checkin/
│   │   ├── medication/
│   │   ├── health/
│   │   ├── appointment/
│   │   ├── sos/
│   │   ├── notification/
│   │   └── media/
│   ├── jobs/                # BullMQ workers
│   │   ├── medication-reminder.job.ts
│   │   ├── checkin-alert.job.ts
│   │   └── appointment-reminder.job.ts
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── redis.ts         # Redis / BullMQ 連線
│   │   ├── r2.ts            # Cloudflare R2 client
│   │   └── expo-push.ts     # Expo Push 封裝
│   ├── utils/
│   └── app.ts               # Fastify instance
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
└── package.json
```

---

## 2. 技術棧總覽

| 層次 | 套件 | 版本 | 用途 |
|------|------|------|------|
| 框架 | fastify | ^4.x | HTTP 伺服器 |
| 語言 | typescript | ^5.x | 型別安全 |
| ORM | @prisma/client | ^5.x | 資料庫存取 |
| 資料庫 | PostgreSQL | 16 | 主資料儲存 |
| 快取/佇列 | ioredis | ^5.x | Redis 連線 |
| 佇列 | bullmq | ^5.x | 背景排程 |
| 驗證 | @fastify/jwt | ^8.x | JWT 認證 |
| 驗證 | zod | ^3.x | Schema 驗證 |
| 推播 | expo-server-sdk | ^3.x | Expo Push |
| 儲存 | @aws-sdk/client-s3 | ^3.x | R2 相容 S3 API |
| 密碼 | bcrypt | ^5.x | 密碼雜湊 |
| 日期 | date-fns | ^3.x | 日期處理 |
| 日誌 | pino | 內建於 Fastify | 結構化日誌 |

### 安裝指令

```bash
npm install fastify @fastify/jwt @fastify/cors @fastify/rate-limit \
  @fastify/multipart @prisma/client bullmq ioredis zod \
  expo-server-sdk @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
  bcrypt date-fns

npm install -D typescript @types/node @types/bcrypt prisma \
  tsx nodemon
```

---

## 3. 環境變數

```env
# 資料庫
DATABASE_URL="postgresql://user:password@localhost:5432/carelink"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="carelink-media"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# App
PORT=3000
NODE_ENV="development"
APP_URL="https://api.carelink.app"
```

---

## 4. 資料庫 Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── 使用者（子女）──
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  familyMemberships FamilyMember[]
  notifications     Notification[]
  notifSettings     NotificationSetting?
  pushTokens        PushToken[]
  acknowledgedSos   SosEvent[]           @relation("AcknowledgedBy")
}

// ── 家族 ──
model Family {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())

  members FamilyMember[]
  elders  Elder[]
}

model FamilyMember {
  id       String           @id @default(uuid())
  role     FamilyMemberRole @default(CAREGIVER)
  joinedAt DateTime         @default(now())

  userId   String
  familyId String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  family   Family @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@unique([userId, familyId])
}

enum FamilyMemberRole {
  PRIMARY    // 主照護者
  CAREGIVER  // 協助者
}

// ── 長輩 ──
model Elder {
  id          String   @id @default(uuid())
  name        String
  birthDate   DateTime?
  avatarUrl   String?
  createdAt   DateTime @default(now())

  familyId    String
  family      Family   @relation(fields: [familyId], references: [id])
  deviceToken String?  // 長輩裝置的 push token
  pairCode    String?  // 配對用一次性 code，配對後清空

  checkins      Checkin[]
  medications   Medication[]
  healthVitals  HealthVital[]
  appointments  Appointment[]
  sosEvents     SosEvent[]
}

// ── 每日回報 ──
model Checkin {
  id         String   @id @default(uuid())
  checkedAt  DateTime @default(now())
  note       String?

  elderId    String
  elder      Elder    @relation(fields: [elderId], references: [id], onDelete: Cascade)
}

// ── 藥物 ──
model Medication {
  id          String            @id @default(uuid())
  name        String
  dosage      String?           // 劑量，例：5mg
  amountPerDose String?         // 每次幾顆
  color       String?           // hex color
  note        String?           // 顯示給長輩的備註
  frequency   MedicationFreq    @default(DAILY)
  status      MedicationStatus  @default(ACTIVE)
  pauseReason String?
  createdAt   DateTime          @default(now())

  elderId     String
  elder       Elder             @relation(fields: [elderId], references: [id], onDelete: Cascade)
  schedules   MedicationSchedule[]
  logs        MedicationLog[]
}

enum MedicationFreq {
  DAILY       // 每日
  EVERY_OTHER // 隔日
  WEEKLY      // 每週
  AS_NEEDED   // 需要時
}

enum MedicationStatus {
  ACTIVE
  PAUSED
  DELETED
}

model MedicationSchedule {
  id           String   @id @default(uuid())
  time         String   // "08:00"
  mealContext  String?  // 早餐後、空腹...
  amountNote   String?  // 此次劑量備註
  isEnabled    Boolean  @default(true)

  medicationId String
  medication   Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)
}

model MedicationLog {
  id           String   @id @default(uuid())
  takenAt      DateTime @default(now())
  photoUrl     String?
  confirmed    Boolean  @default(false)
  scheduleTime String?  // 對應哪個排程時間

  medicationId String
  medication   Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)
}

// ── 健康數值 ──
model HealthVital {
  id           String          @id @default(uuid())
  type         HealthVitalType
  measuredAt   DateTime        @default(now())

  // 血壓
  systolic     Int?
  diastolic    Int?
  // 血糖
  glucoseValue Float?
  mealContext  String?         // 空腹、餐後2hr、睡前

  elderId      String
  elder        Elder           @relation(fields: [elderId], references: [id], onDelete: Cascade)
}

enum HealthVitalType {
  BLOOD_PRESSURE
  BLOOD_SUGAR
}

// ── 回診行程 ──
model Appointment {
  id           String            @id @default(uuid())
  department   String
  hospital     String
  scheduledAt  DateTime
  note         String?
  status       AppointmentStatus @default(UPCOMING)
  remindDays   Int[]             @default([1, 7]) // 提前幾天提醒
  createdAt    DateTime          @default(now())

  elderId      String
  elder        Elder             @relation(fields: [elderId], references: [id], onDelete: Cascade)
}

enum AppointmentStatus {
  UPCOMING
  COMPLETED
  CANCELLED
}

// ── SOS 事件 ──
model SosEvent {
  id              String    @id @default(uuid())
  triggeredAt     DateTime  @default(now())
  acknowledgedAt  DateTime?
  location        String?   // JSON string of {lat, lng}

  elderId         String
  elder           Elder     @relation(fields: [elderId], references: [id])
  acknowledgedBy  User?     @relation("AcknowledgedBy", fields: [acknowledgedById], references: [id])
  acknowledgedById String?
}

// ── 通知 ──
model Notification {
  id        String           @id @default(uuid())
  type      NotificationType
  title     String
  body      String
  data      Json?            // 額外 payload
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum NotificationType {
  CHECKIN         // 每日回報
  MEDICATION      // 服藥確認
  MEDICATION_MISSED // 漏服警示
  SOS             // 緊急
  APPOINTMENT     // 回診提醒
  CHECKIN_OVERDUE // 未回報警示
}

model NotificationSetting {
  id              String   @id @default(uuid())
  checkin         Boolean  @default(true)
  medication      Boolean  @default(true)
  medicationMissed Boolean @default(true)
  sos             Boolean  @default(true)
  appointment     Boolean  @default(true)
  checkinOverdue  Boolean  @default(true)
  quietStart      String?  // "22:00"
  quietEnd        String?  // "07:00"

  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
}

model PushToken {
  id        String   @id @default(uuid())
  token     String   @unique
  platform  String   // ios | android
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 5. API 規格

### 共用規範

**Base URL：** `https://api.carelink.app/v1`

**認證 Header：**
```
Authorization: Bearer <access_token>
```

**通用回應格式：**
```typescript
// 成功
{ success: true, data: T }

// 失敗
{ success: false, error: { code: string, message: string } }

// 分頁
{ success: true, data: T[], meta: { page: number, limit: number, total: number } }
```

---

### 5.1 認證 `/auth`

#### `POST /auth/register`
建立子女帳號。

**Request:**
```json
{
  "name": "陳志明",
  "email": "chih-ming@example.com",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "陳志明", "email": "chih-ming@example.com" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

#### `POST /auth/login`
**Request:**
```json
{ "email": "chih-ming@example.com", "password": "password123" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "陳志明", "email": "..." },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

#### `POST /auth/refresh`
**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{ "success": true, "data": { "accessToken": "eyJ..." } }
```

---

#### `POST /auth/logout`
**Request:** `Authorization: Bearer <token>`  
**Response 200:** `{ "success": true }`

---

#### `POST /auth/elder/pair`
產生長輩配對 QR code（子女端操作，產生一次性 6 碼）。

**Request:** `Authorization: Bearer <token>`
```json
{ "elderId": "uuid" }
```

**Response 200:**
```json
{
  "success": true,
  "data": { "pairCode": "A3K9X2", "expiresAt": "2026-04-22T10:00:00Z" }
}
```

---

#### `POST /auth/elder/verify`
長輩裝置掃描後呼叫，完成配對並取得長輩端 token。

**Request:**
```json
{ "pairCode": "A3K9X2", "pushToken": "ExponentPushToken[xxx]", "platform": "ios" }
```

**Response 200:**
```json
{
  "success": true,
  "data": { "elderId": "uuid", "elderToken": "eyJ..." }
}
```

---

### 5.2 家族 `/family`

#### `GET /family/:familyId`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid", "name": "陳家",
    "members": [{ "userId": "uuid", "name": "陳志明", "role": "PRIMARY" }],
    "elders": [{ "id": "uuid", "name": "陳秀英" }]
  }
}
```

---

#### `POST /family`
建立新家族。

**Request:**
```json
{ "name": "陳家" }
```

---

#### `POST /family/:familyId/invite`
產生邀請連結（7 天有效）。

**Response 200:**
```json
{
  "success": true,
  "data": { "inviteLink": "https://carelink.app/join/TOKEN", "expiresAt": "..." }
}
```

---

#### `POST /family/join`
透過邀請連結加入家族。

**Request:**
```json
{ "inviteToken": "TOKEN" }
```

---

#### `PUT /family/:familyId/members/:userId/role`
**Request:**
```json
{ "role": "CAREGIVER" }
```

---

#### `DELETE /family/:familyId/members/:userId`
移除家族成員。

---

### 5.3 長輩 `/elders`

#### `POST /family/:familyId/elders`
新增長輩。

**Request:**
```json
{ "name": "陳秀英", "birthDate": "1944-03-15" }
```

---

#### `GET /elders/:elderId`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid", "name": "陳秀英", "birthDate": "1944-03-15", "avatarUrl": null
  }
}
```

---

#### `PUT /elders/:elderId`
更新長輩資料。

**Request:**
```json
{ "name": "陳秀英", "avatarUrl": "https://..." }
```

---

#### `GET /elders/:elderId/status`
儀表板摘要狀態，一次取得所有需要的資料。

**Response 200:**
```json
{
  "success": true,
  "data": {
    "checkinToday": { "checked": true, "checkedAt": "2026-04-22T08:34:00Z", "streakDays": 8 },
    "medications": { "total": 3, "completedToday": 2, "nextReminder": "21:00" },
    "nextAppointment": { "id": "uuid", "department": "心臟科", "scheduledAt": "2026-04-22T10:30:00Z", "daysLeft": 2 },
    "lastBP": { "systolic": 120, "diastolic": 80, "measuredAt": "2026-04-22T09:15:00Z" },
    "lastGlucose": { "value": 7.8, "context": "餐後", "measuredAt": "2026-04-22T09:20:00Z" }
  }
}
```

---

#### `PUT /elders/:elderId/push-token`
更新長輩裝置推播 Token（長輩端呼叫）。

**Request:**
```json
{ "pushToken": "ExponentPushToken[xxx]", "platform": "android" }
```

---

### 5.4 每日回報 `/checkins`

#### `POST /elders/:elderId/checkins`
長輩按「我很好」呼叫此 API，後端自動推播通知給所有家族成員。

**Request:** （長輩端 Bearer elderToken）
```json
{ "note": null }
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": "uuid", "checkedAt": "2026-04-22T08:34:00Z", "streakDays": 8 }
}
```

---

#### `GET /elders/:elderId/checkins`
**Query params:** `?from=2026-04-01&to=2026-04-22&limit=30&page=1`

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "checkedAt": "2026-04-22T08:34:00Z" }
  ],
  "meta": { "page": 1, "limit": 30, "total": 22 }
}
```

---

#### `GET /elders/:elderId/checkins/today`
**Response 200:**
```json
{
  "success": true,
  "data": { "checked": true, "checkedAt": "2026-04-22T08:34:00Z" }
}
```

---

#### `GET /elders/:elderId/checkins/streak`
**Response 200:**
```json
{ "success": true, "data": { "streakDays": 8, "lastCheckinAt": "2026-04-22T08:34:00Z" } }
```

---

### 5.5 服藥管理 `/medications`

#### `GET /elders/:elderId/medications`
取得完整藥物清單含今日服藥狀態。

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", "name": "降血壓藥", "dosage": "5mg", "color": "#a855f7",
      "status": "ACTIVE", "frequency": "DAILY",
      "schedules": [
        { "id": "uuid", "time": "08:00", "mealContext": "早餐後", "isEnabled": true }
      ],
      "todayLogs": [
        { "id": "uuid", "takenAt": "2026-04-22T08:05:00Z", "scheduleTime": "08:00", "photoUrl": "https://..." }
      ]
    }
  ]
}
```

---

#### `POST /elders/:elderId/medications`
**Request:**
```json
{
  "name": "鈣片",
  "dosage": "600mg",
  "amountPerDose": "1顆",
  "color": "#3b82f6",
  "note": "搭配開水服用",
  "frequency": "DAILY",
  "schedules": [
    { "time": "08:30", "mealContext": "早餐後" },
    { "time": "12:30", "mealContext": "午餐後" }
  ]
}
```

---

#### `PUT /medications/:medId`
更新藥物資料（同上 Request 格式，欄位可部分更新）。

---

#### `DELETE /medications/:medId`
軟刪除（status 改為 DELETED）。

---

#### `PATCH /medications/:medId/pause`
**Request:**
```json
{ "pause": true, "reason": "手術前停藥" }
```

---

#### `POST /medications/:medId/schedules`
新增提醒時間。

**Request:**
```json
{ "time": "21:00", "mealContext": "睡前", "amountNote": "1顆" }
```

---

#### `PUT /medications/:medId/schedules/:schedId`
**Request:**
```json
{ "time": "20:00", "isEnabled": false }
```

---

#### `DELETE /medications/:medId/schedules/:schedId`

---

#### `POST /medications/:medId/logs`
長輩確認服藥後呼叫，後端推播「服藥完成」通知給家族。

**Request:**
```json
{ "scheduleTime": "08:00", "photoUrl": "https://r2.../photo.jpg" }
```

**Response 201:**
```json
{ "success": true, "data": { "id": "uuid", "takenAt": "...", "confirmed": true } }
```

---

#### `GET /elders/:elderId/medication-logs`
**Query params:** `?date=2026-04-22` 或 `?from=2026-04-01&to=2026-04-22`

---

### 5.6 健康數值 `/vitals`

#### `POST /elders/:elderId/vitals/blood-pressure`
**Request:**
```json
{ "systolic": 120, "diastolic": 80, "measuredAt": "2026-04-22T09:15:00Z" }
```

**後端處理：** 若收縮壓 ≥ 140，自動推播「血壓偏高」警示。

---

#### `GET /elders/:elderId/vitals/blood-pressure`
**Query params:** `?from=2026-04-15&to=2026-04-22&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "systolic": 120, "diastolic": 80, "measuredAt": "2026-04-22T09:15:00Z" }
  ]
}
```

---

#### `POST /elders/:elderId/vitals/blood-sugar`
**Request:**
```json
{ "glucoseValue": 7.8, "mealContext": "餐後2hr", "measuredAt": "2026-04-22T09:20:00Z" }
```

---

#### `GET /elders/:elderId/vitals/blood-sugar`
同上血壓格式。

---

#### `GET /elders/:elderId/vitals/summary`
一次取得最新數值與本週均值。

**Response 200:**
```json
{
  "success": true,
  "data": {
    "bloodPressure": {
      "latest": { "systolic": 120, "diastolic": 80, "measuredAt": "..." },
      "weeklyAvg": { "systolic": 122, "diastolic": 79 },
      "status": "NORMAL"
    },
    "bloodSugar": {
      "latest": { "value": 7.8, "context": "餐後2hr", "measuredAt": "..." },
      "weeklyAvg": 6.4,
      "status": "HIGH"
    }
  }
}
```

---

### 5.7 回診行程 `/appointments`

#### `GET /elders/:elderId/appointments`
**Query params:** `?status=UPCOMING` 或 `?status=COMPLETED`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", "department": "心臟科複診", "hospital": "台大醫院",
      "scheduledAt": "2026-04-22T10:30:00Z", "note": "記得空腹",
      "status": "UPCOMING", "daysLeft": 2, "remindDays": [1, 7]
    }
  ]
}
```

---

#### `POST /elders/:elderId/appointments`
**Request:**
```json
{
  "department": "心臟科複診",
  "hospital": "台大醫院",
  "scheduledAt": "2026-04-22T10:30:00Z",
  "note": "記得空腹，帶健保卡",
  "remindDays": [1, 7]
}
```

---

#### `PUT /appointments/:apptId`
更新行程（同上格式）。

---

#### `DELETE /appointments/:apptId`

---

#### `PATCH /appointments/:apptId/complete`
**Request:**
```json
{ "note": "醫師說血壓控制良好" }
```

---

### 5.8 SOS 緊急 `/sos`

#### `POST /elders/:elderId/sos`
長輩按下 SOS 長按確認後呼叫，立即推播給所有家族成員。

**Request:** （長輩端 elderToken）
```json
{ "location": { "lat": 25.033, "lng": 121.565 } }
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid", "triggeredAt": "2026-04-22T08:47:00Z",
    "notifiedMembers": ["陳志明", "陳美華"]
  }
}
```

---

#### `GET /elders/:elderId/sos/history`
**Query params:** `?limit=20&page=1`

---

#### `PATCH /sos/:sosId/acknowledge`
子女端確認已知悉 SOS。

**Request:** `Authorization: Bearer <caregiver_token>`
```json
{}
```

---

### 5.9 通知 `/notifications`

#### `GET /users/:userId/notifications`
**Query params:** `?unread=true&page=1&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", "type": "CHECKIN", "title": "媽媽說「我很好」",
      "body": "連續 8 天回報", "isRead": false, "createdAt": "2026-04-22T08:34:00Z",
      "data": { "elderId": "uuid" }
    }
  ],
  "meta": { "unreadCount": 3 }
}
```

---

#### `PATCH /notifications/:notifId/read`
**Response 200:** `{ "success": true }`

---

#### `PATCH /users/:userId/notifications/read-all`

---

#### `GET /users/:userId/notification-settings`

---

#### `PUT /users/:userId/notification-settings`
**Request:**
```json
{
  "checkin": true, "medication": true, "medicationMissed": true,
  "sos": true, "appointment": true, "checkinOverdue": true,
  "quietStart": "22:00", "quietEnd": "07:00"
}
```

---

#### `POST /users/:userId/push-tokens`
子女端登入後或 token 更新時呼叫。

**Request:**
```json
{ "token": "ExponentPushToken[xxx]", "platform": "ios" }
```

---

### 5.10 媒體上傳 `/media`

前端直接上傳到 R2，後端只產生 presigned URL 與確認完成。

#### `POST /media/upload-url`
**Request:**
```json
{ "filename": "photo.jpg", "contentType": "image/jpeg", "context": "medication-log" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://xxx.r2.cloudflarestorage.com/...",
    "key": "medication-logs/uuid/photo.jpg",
    "expiresIn": 300
  }
}
```

#### `POST /media/confirm`
上傳完成後告知後端。

**Request:**
```json
{ "key": "medication-logs/uuid/photo.jpg" }
```

**Response 200:**
```json
{
  "success": true,
  "data": { "mediaId": "uuid", "publicUrl": "https://pub-xxx.r2.dev/medication-logs/uuid/photo.jpg" }
}
```

---

## 6. 背景排程與佇列

### 6.1 BullMQ 佇列設計

```typescript
// src/lib/redis.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

export const redis = new IORedis(process.env.REDIS_URL!);

// 定義 queue
export const medicationReminderQueue = new Queue('medication-reminder', { connection: redis });
export const checkinAlertQueue = new Queue('checkin-alert', { connection: redis });
export const appointmentReminderQueue = new Queue('appointment-reminder', { connection: redis });
```

### 6.2 三種 Cron 排程

#### 服藥提醒（每分鐘掃描）
```typescript
// 每分鐘掃描是否有 schedule.time 等於當前時間
// 找到後推播給長輩端
cron.schedule('* * * * *', async () => {
  const now = format(new Date(), 'HH:mm');
  const schedules = await prisma.medicationSchedule.findMany({
    where: { time: now, isEnabled: true, medication: { status: 'ACTIVE' } },
    include: { medication: { include: { elder: true } } }
  });
  for (const s of schedules) {
    await medicationReminderQueue.add('remind', {
      elderId: s.medication.elderId,
      medicationId: s.medication.id,
      scheduleId: s.id,
      time: s.time
    }, { delay: 0 });
    // 1 小時後檢查是否有服藥記錄，沒有則推播「漏服警示」給子女
    await medicationReminderQueue.add('check-missed', { ... }, { delay: 60 * 60 * 1000 });
  }
});
```

#### 每日回報逾時警示（每天 10:00 執行）
```typescript
// 每天 10:00 檢查所有長輩，找出今天未回報的
cron.schedule('0 10 * * *', async () => {
  const today = startOfDay(new Date());
  const elders = await prisma.elder.findMany({ /* 取得所有長輩 */ });
  for (const elder of elders) {
    const checked = await prisma.checkin.findFirst({
      where: { elderId: elder.id, checkedAt: { gte: today } }
    });
    if (!checked) {
      await checkinAlertQueue.add('overdue', { elderId: elder.id });
    }
  }
});
```

#### 回診提醒（每天 09:00 執行）
```typescript
cron.schedule('0 9 * * *', async () => {
  const appointments = await prisma.appointment.findMany({
    where: { status: 'UPCOMING' }
  });
  for (const appt of appointments) {
    const daysLeft = differenceInDays(appt.scheduledAt, new Date());
    if (appt.remindDays.includes(daysLeft)) {
      await appointmentReminderQueue.add('remind', {
        elderId: appt.elderId, appointmentId: appt.id, daysLeft
      });
    }
  }
});
```

---

## 7. 推播通知

### 7.1 Expo Push 封裝

```typescript
// src/lib/expo-push.ts
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export type PushPayload = {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
};

export async function sendPush(payload: PushPayload) {
  const tokens = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validTokens = tokens.filter(t => Expo.isExpoPushToken(t));

  const messages: ExpoPushMessage[] = validTokens.map(token => ({
    to: token,
    sound: payload.sound ?? 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    badge: payload.badge,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
```

### 7.2 各類通知的推播內容

| 類型 | Title | Body |
|------|-------|------|
| `CHECKIN` | `😊 媽媽說「我很好」` | `今天 {time} 回報・連續 {n} 天` |
| `MEDICATION` | `💊 媽媽服藥完成` | `{藥名} 已確認服用` |
| `MEDICATION_MISSED` | `⚠️ 服藥提醒` | `媽媽的 {藥名} 已超過 1 小時未確認` |
| `SOS` | `🚨 緊急！媽媽按下 SOS` | `請立即確認狀況` |
| `APPOINTMENT` | `🏥 回診提醒` | `媽媽的 {科別} 還有 {n} 天` |
| `CHECKIN_OVERDUE` | `⚠️ 媽媽今天還沒回報` | `已超過 10 小時未按「我很好」` |

---

## 8. 圖片上傳 (Cloudflare R2)

### 8.1 R2 Client 設定

```typescript
// src/lib/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn: 300 }); // 5 分鐘有效
}

export function getPublicUrl(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
```

### 8.2 前端上傳流程

```typescript
// 前端 React Native 端
async function uploadMedicationPhoto(uri: string) {
  // Step 1: 取得 presigned URL
  const { data } = await api.post('/media/upload-url', {
    filename: 'photo.jpg', contentType: 'image/jpeg', context: 'medication-log'
  });

  // Step 2: 直接上傳到 R2（不經過後端伺服器）
  const file = await fetch(uri);
  const blob = await file.blob();
  await fetch(data.uploadUrl, {
    method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' }
  });

  // Step 3: 告知後端上傳完成
  const { data: mediaData } = await api.post('/media/confirm', { key: data.key });
  return mediaData.publicUrl;
}
```

---

## 9. 認證機制

### 9.1 雙 Token 流程

```
登入 → accessToken (15min) + refreshToken (30d)
         ↓
accessToken 過期 → 前端自動用 refreshToken 換新
         ↓
refreshToken 也過期 → 導回登入頁
```

### 9.2 長輩端獨立 Token

長輩裝置使用 `elderToken`（較長效，90天），型別與子女端 JWT 分開驗證：

```typescript
// JWT payload 結構
type UserTokenPayload = { sub: string; type: 'user'; role: 'caregiver' };
type ElderTokenPayload = { sub: string; type: 'elder'; elderId: string };
```

---

## 10. 錯誤代碼規範

```typescript
// packages/shared/constants/errors.ts
export const ErrorCodes = {
  // 認證
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_PAIR_CODE_INVALID: 'AUTH_PAIR_CODE_INVALID',

  // 資源
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // 業務邏輯
  CHECKIN_ALREADY_DONE: 'CHECKIN_ALREADY_DONE',    // 今天已回報
  MEDICATION_PAUSED: 'MEDICATION_PAUSED',           // 藥物已暫停
  APPOINTMENT_PAST: 'APPOINTMENT_PAST',             // 行程已過期

  // 通用
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

**HTTP 狀態碼對應：**
| 狀態碼 | 使用情境 |
|--------|---------|
| 200 | 成功取得 / 更新 |
| 201 | 成功建立 |
| 400 | 驗證失敗 / 業務規則錯誤 |
| 401 | 未登入 / Token 無效 |
| 403 | 無權限（已登入但無法操作） |
| 404 | 資源不存在 |
| 409 | 衝突（例：今天已回報） |
| 429 | Rate limit 超過 |
| 500 | 伺服器錯誤 |

---

## 11. 前後端整合建議

### 11.1 共用型別使用方式

```typescript
// packages/shared/types/api.ts
export type CheckinResponse = {
  id: string;
  checkedAt: string;
  streakDays: number;
};

export type ElderStatusResponse = {
  checkinToday: { checked: boolean; checkedAt: string | null; streakDays: number };
  medications: { total: number; completedToday: number; nextReminder: string | null };
  nextAppointment: { id: string; department: string; scheduledAt: string; daysLeft: number } | null;
};

// 前端 React Native
import type { ElderStatusResponse } from '@carelink/shared/types/api';

// 後端 Fastify
import type { ElderStatusResponse } from '@carelink/shared/types/api';
```

### 11.2 前端 API Client 建議（React Query）

```typescript
// apps/mobile/src/lib/api.ts
import axios from 'axios';

export const api = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });

// 自動帶 token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 自動 refresh token
api.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const { data } = await axios.post('/auth/refresh', { refreshToken });
      await SecureStore.setItemAsync('accessToken', data.data.accessToken);
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 11.3 Monorepo 啟動指令

```json
// package.json (root)
{
  "scripts": {
    "dev": "turbo dev",
    "dev:api": "turbo dev --filter=@carelink/api",
    "dev:mobile": "turbo dev --filter=@carelink/mobile",
    "db:push": "cd apps/api && npx prisma db push",
    "db:studio": "cd apps/api && npx prisma studio"
  }
}
```

### 11.4 建議開發順序

1. **Phase 1（能跑通 MVP）**  
   Auth → Elder + Family → Checkin → Medication → SOS → Notifications

2. **Phase 2（第二階段功能）**  
   HealthVitals → Appointments → BullMQ 排程 → 漏服警示

3. **Phase 3（基礎設施完善）**  
   R2 圖片上傳 → Rate limiting → 錯誤監控（Sentry）→ 部署 CI/CD

---

*文件由 CareLink 開發規劃產出 · 版本 v1.0*
