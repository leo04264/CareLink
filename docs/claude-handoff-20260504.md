# Claude Code 遠端開發交接

日期：2026-05-04
從：sandbox session（GitHub Actions 限制：無法對外連 ngrok / cloudflared，部署只能在本機）
到：Mac Mini 本機 Claude Code session
基底分支：`master`（PR M / PR N 已 merge）
WIP 分支：`wip/remote-to-local-20260504`

---

## 目前目標

實作 **PR O — Mac Mini 本機後端 + Cloudflare Tunnel quick mode + GitHub Pages 前端** 的一條龍腳本。

讓使用者一行指令就能：
1. 拉最新 code → typecheck → test → build:api → 重啟 backend
2. 自動起 cloudflared tunnel quick mode 拿到 `https://*.trycloudflare.com`
3. 觸發 GitHub Actions `workflow_dispatch` 把該 URL 注入前端 web build
4. 部署到 https://leo04264.github.io/CareLink/

預期跑完約 4–5 分鐘 demo 可用。

---

## 已完成變更

**這個 session 沒寫任何 code。** 整段時間都在 Gate 1：和使用者確認 spec、權衡方案。

歷史背景（前面 session 已 merge 進 master）：
- **PR M（#17，已 merge）**：mobile 端建立 live/mock 雙模式骨架（AuthProvider、apiClient、AsyncStorage、TweaksPanel mode toggle、登入/註冊畫面）
- **PR N（#18，已 merge）**：caregiver 自動 bootstrap family + elder + 配對碼、ElderPairingScreen、`postCheckin` / `getTodayCheckin` 接線、`useLiveReportStatus` 5 分鐘輪詢 + AppState 前景 refetch

---

## 修改過的檔案

本 session：**無**。

---

## 已執行測試

本 session：**無**（純設計討論）。

---

## 尚未完成 — PR O 待實作清單

### 新增

| 檔案 | 內容 |
|---|---|
| `scripts/dev-tunnel.sh` | 主腳本，整套流程一行跑完 |
| `scripts/pm2.config.cjs` | pm2 ecosystem，定義 `carelink-api` process（entry: `apps/api/dist/server.js`） |
| `scripts/setup-macmini.md` | 一次性手動步驟（brew install、gh auth、npm ci） |

### 修改

| 檔案 | 改動 |
|---|---|
| `.github/workflows/deploy-web.yml` | 加 `workflow_dispatch.inputs.apiBaseUrl: { type: string, required: false }`；build step 加 `env: EXPO_PUBLIC_API_BASE_URL: ${{ inputs.apiBaseUrl }}` |
| `apps/mobile/src/services/apiConfig.ts` | `getApiBaseUrl()` 優先讀 `process.env.EXPO_PUBLIC_API_BASE_URL`，其次走原本 expo-constants 路徑 |
| `apps/api/src/app.ts` | CORS origin 加 `https://leo04264.github.io` 與 `*.trycloudflare.com`（regex 或 function 判斷） |
| `apps/api/.env.example` | 加 `CORS_ORIGINS=` 說明 |

### `scripts/dev-tunnel.sh` 預期邏輯（pseudo）

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# (1) Backend CI — 任何一步失敗就 exit 1
git pull --ff-only
npm ci
npm run typecheck                  # @carelink/shared + @carelink/api
npm test --workspaces --if-present # 目前 api 沒 test 也 OK
npm run build:api

# (2) pm2 reload (首次自動 start)
pm2 reload scripts/pm2.config.cjs --update-env || pm2 start scripts/pm2.config.cjs

# (3) 等 /health（最多 30s）
for i in {1..30}; do
  curl -fs http://localhost:3000/health >/dev/null && break
  sleep 1
done

# (4) 殺舊 tunnel + 起新的
pkill -f "cloudflared tunnel" || true
sleep 1
LOG=/tmp/carelink-tunnel.log
nohup cloudflared tunnel --url http://localhost:3000 > "$LOG" 2>&1 &

# (5) 抓 URL（最多 30s）
URL=""
for i in {1..30}; do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)
  [ -n "$URL" ] && break
  sleep 1
done
[ -z "$URL" ] && { echo "ERR: tunnel URL not found"; exit 1; }
echo "Tunnel: $URL"

# (6) 觸發前端 deploy
gh workflow run deploy-web.yml -f apiBaseUrl="$URL"
echo "Frontend deploy triggered. Check: https://github.com/leo04264/CareLink/actions"
```

---

## 目前已知問題

1. **Cloudflare quick tunnel URL 每次都會變** — 重跑 `dev-tunnel.sh` 一定會換 URL，所以前端必定要重 deploy。Cloudflare 沒公開 rate limit；他們文件明說 quick tunnel 不適合 production。
2. **Mac Mini 睡眠會斷 tunnel** — 系統偏好設定 → 節能 → 關閉睡眠，或 `caffeinate -d -i -s` 包起來跑。
3. **GitHub Pages CDN propagation** — `workflow_dispatch` 結束後還要約 1–2 分鐘 Pages 邊緣節點才更新，總冷啟動 4–5 分鐘。
4. **CORS 開 `*.trycloudflare.com` 等於對外公開** — 個人 demo OK，這個 backend 不要存敏感資料。
5. **`apps/api` 目前沒實際 test command** — `npm test --if-present` 會跳過，等加測試後自動 enforce。

---

## 下一步建議

1. **先看 `apps/mobile/src/services/apiConfig.ts` 現況** — 確認 `EXPO_PUBLIC_API_BASE_URL` 注入點怎麼對接最乾淨（可能需要改 expo `extra` 或直接讀 `process.env`）
2. **看 `apps/api/src/app.ts` CORS 現況** — 改成支援 wildcard 或 function-based origin check
3. **看 `.github/workflows/deploy-web.yml`** — 加 `workflow_dispatch` 並把 input 注入 build env
4. **寫 `scripts/dev-tunnel.sh` + `scripts/pm2.config.cjs`** — 對著上面 pseudo
5. **寫 `scripts/setup-macmini.md`** — 一次性 brew install / gh auth login 步驟
6. **本機跑一次 `./scripts/dev-tunnel.sh` 驗證** — 確認 URL 抓得到、workflow 觸發成功、Pages 更新後 mobile 真的能打到本機 backend
7. 開 PR O 給使用者 review（CLAUDE.md Gate 2）

---

## 重要決策（使用者已拍板，不要再改）

| # | 議題 | 選擇 |
|---|---|---|
| 1 | 後端 CI 範圍 | **b — typecheck + test + build**，任一失敗就停 |
| 2 | 觸發方式 | **手動 `./scripts/dev-tunnel.sh`**，不裝 launchd / cron。要更新就再跑一次 |
| 3 | URL 沒變要不要還是 redeploy 前端 | **b — 永遠 redeploy**，多花 ~2 min Actions 配額換一致性 |
| 4 | gh CLI 認證方式 | **a — `gh auth login` 走 macOS keychain** |
| 5 | Backend process 管理 | **a — pm2** |

### 為何不選 launchd / 自動啟動
使用者明確要「我想要跑腳本執行跟重跑就好或是讓 claude code 跑在 mac mini 上面去執行重啟服務」。可以的話，把 dev-tunnel.sh 寫成「使用者跑一次 = 一輪完整管線」就好，不要加 file watcher、不要加排程。

### 為何 quick tunnel 而非 named tunnel
使用者要求「真的免費」。named tunnel 需要把 domain 上 Cloudflare（仍免費，但要有 domain）。quick tunnel 完全不需要任何帳號 / 設定 — 缺點是 URL 每次都變，由前端永遠 redeploy（決策 3）抵銷。
