# Mac Mini 一次性設定 — CareLink 本機後端 + Cloudflare Tunnel

這份只需要跑**一次**。完成後日常只用：

```bash
./scripts/dev-tunnel.sh
```

---

## 1. 安裝必要工具（Homebrew）

```bash
# 沒裝 Homebrew 先：
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node 20+（Apple Silicon 預設裝最新 LTS）
brew install node

# Process manager
npm install -g pm2

# Cloudflare Tunnel client
brew install cloudflared

# GitHub CLI
brew install gh

# Docker（給 postgres + redis；若已裝 Docker Desktop 可略）
brew install --cask docker
open -a Docker     # 第一次要打開讓 Docker daemon 起來
```

驗證：

```bash
node -v        # 應 ≥ v20
pm2 -v
cloudflared --version
gh --version
docker ps      # 不噴 error 即可
```

---

## 2. GitHub CLI 認證（macOS keychain）

```bash
gh auth login
```

互動選項：
- What account → **GitHub.com**
- Preferred protocol → **HTTPS**
- Authenticate Git → **Yes**
- How to authenticate → **Login with a web browser**

完成後驗證：

```bash
gh auth status
gh repo view leo04264/CareLink   # 看得到 repo 描述代表 OK
```

---

## 3. Clone repo + 安裝依賴

```bash
cd ~  # 或你想放的目錄
git clone https://github.com/leo04264/CareLink.git
cd CareLink
npm ci
```

---

## 4. 建 backend `.env`

```bash
cp apps/api/.env.example apps/api/.env
```

編輯 `apps/api/.env`：
- `JWT_SECRET=` 改成隨機 32+ 字元（`openssl rand -base64 48`）
- 其他預設值（DB、Redis 都指 localhost docker）通常不用動
- demo 想看推播：`EXPO_PUSH_ENABLED=true`
- 想加額外 CORS 來源：`CORS_ORIGINS=https://your.domain`（內建已含 GitHub Pages + `*.trycloudflare.com`）

---

## 5. 啟 infra + 第一次 migrate

```bash
npm run infra:up                          # postgres + redis
npm -w @carelink/api run db:migrate       # 套用 prisma migrations
```

---

## 6. 設定 pm2 開機自動啟動（選用，但建議）

讓 Mac Mini 重開後 `carelink-api` / `carelink-workers` 自動回來：

```bash
pm2 start scripts/pm2.config.cjs
pm2 save
pm2 startup    # 會印一行 sudo 指令，照貼一次執行即可
```

> 開機自動啟動只負責後端 process。**Cloudflare tunnel 不會自動起來**，因為 quick tunnel URL 每次重抓都會變、前端必須重 deploy 才認得。要更新 demo URL 一律跑 `./scripts/dev-tunnel.sh`。

---

## 7. 防止 Mac Mini 睡眠斷 tunnel

兩個選擇：

**A. 系統設定永不睡眠（推薦）**
系統設定 → 電池/節能 → 螢幕關閉時不要進入睡眠 = ON。

**B. 用 caffeinate 包腳本（臨時）**
```bash
caffeinate -d -i -s ./scripts/dev-tunnel.sh
```

---

## 8. 驗證

第一次跑：

```bash
./scripts/dev-tunnel.sh
```

看到最後印出：
- `Tunnel URL: https://xxx-yyy-zzz.trycloudflare.com`
- `workflow 已觸發`

去 https://github.com/leo04264/CareLink/actions 看 deploy-web 跑完（約 2–3 分鐘），再等 GitHub Pages CDN 推 1–2 分鐘，打開 https://leo04264.github.io/CareLink/ 切到 live 模式（TweaksPanel）就會打到本機 backend。

---

## 常見問題

**Q. `pm2 reload` 報 `script not found`**
還沒跑 `npm run build:api`，dist/ 是空的。`dev-tunnel.sh` 會自動處理；單獨跑 `pm2 start` 前手動跑一次。

**Q. tunnel 起得來但前端打不到**
1. 看 `tail -f /tmp/carelink-tunnel.log` 有沒有 5xx
2. 直接 `curl https://你的tunnel.trycloudflare.com/health` 試
3. CORS 噴錯：檢查 `apps/api/.env` 的 `CORS_ORIGINS`，或看 backend log
4. 前端 build 還在跑 / Pages CDN 還沒 propagate（開無痕視窗清快取）

**Q. workflow 觸發報 `could not find any workflows`**
新加的 `workflow_dispatch` input 必須先 merge 到 master，gh CLI 才看得到。PR O 還沒 merge 前先用 `gh workflow run deploy-web.yml --ref wip/remote-to-local-20260504 -f apiBaseUrl=...` 暫時測試。
