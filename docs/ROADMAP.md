# Roadmap

後端 module 開發順序（對應 `spec/carelink-backend-spec.md` §5）。每個 PR = 一個 module，遵循
spec §11.4 建議開發順序。Mobile 端的對應 mock 在每次 module merge 後才逐條替換（仍見 `docs/MOCKS.md`）。

---

## 已完成

| PR | 標題 | 合入 master |
|---|---|---|
| A | Move frontend into apps/mobile/ + npm workspaces | ✅ |
| B | @carelink/shared + apps/api Fastify skeleton | ✅ |
| D | /auth — register / login / refresh / logout + elder pair / verify | ✅ |

---

## 暫緩

| PR | 標題 | 原因 |
|---|---|---|
| C | Fly.io / Render / Hetzner deploy workflow | 見 `docs/MOCKS.md` — demo 前必須決定但目前先跳過 |

---

## 待實作（按 spec §11.4 順序）

| PR | Module | Spec §  | 主要內容 | 依賴 |
|---|---|---|---|---|
| E | `/family` + `/elders` | §5.2, §5.3 | 家族成員 CRUD；長輩 profile CRUD；補齊 Elder schema（birthDate, avatarUrl 等） | Auth ✅ |
| F | `/checkins` | §5.4 | 「我很好」每日回報；今日已回報回 409 `CHECKIN_ALREADY_DONE` | E |
| G | `/medications` | §5.5 | Medication + MedicationSchedule + MedicationLog；暫停 / 刪除；每日提醒時間 | E |
| H | `/vitals` | §5.6 | 血壓 / 血糖紀錄；7 天趨勢查詢（分鐘時間窗切片） | E |
| I | `/appointments` | §5.7 | 回診行程 CRUD；提前提醒（當天 / 1 天前 / 3 天前 / 1 週前） | E |
| J | `/sos` | §5.8 | SOS 事件 + 扇出緊急聯絡人；ACK 串流；可選 119 再確認 | E + 推播 |
| K | `/notifications` + BullMQ | §5.9 + §6 | Notification CRUD；三種 cron 排程（漏回報、漏服、回診提醒）；Expo Push | 多數 modules |
| L | `/media` | §5.10 | 拍照上傳 Cloudflare R2；presigned URL；AI 驗證 hook | E |

---

## 每個 PR 結束時要做的事

1. Module 測試通過（spec 的 request / response shape、error code 對上）
2. `@carelink/shared` 的對應 DTO 有加進去
3. `apps/mobile/src/services/mocks.js` 對應 function 換成真 API（或留下 TODO 註記等部署方案決定再換）
4. `docs/MOCKS.md` 更新狀態欄位
5. 本 roadmap 的「已完成」表格更新
