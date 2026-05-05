#!/usr/bin/env bash
# CareLink — Mac Mini local backend + Cloudflare quick tunnel + Pages redeploy.
#
# 一行指令跑完整套：
#   ./scripts/dev-tunnel.sh
#
# 依序：
#   1. git pull → npm ci → typecheck → test → build:api
#   2. infra:up（postgres + redis）
#   3. prisma migrate deploy
#   4. pm2 reload（carelink-api + carelink-workers）
#   5. 等 GET /health 回 200（最多 30s）
#   6. 殺舊 cloudflared，起新的 quick tunnel，抓 *.trycloudflare.com URL
#   7. gh workflow run deploy-web.yml -f apiBaseUrl=<URL>（targets master）
#
# 任何一步失敗就 exit 1。預期完整跑完約 4–5 分鐘（GitHub Actions + Pages CDN）。
#
# 前置條件：scripts/setup-macmini.md 已跑過一次。

set -euo pipefail

cd "$(dirname "$0")/.."

# ---------- 顏色輸出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { printf "\n${BLUE}==>${NC} ${1}\n"; }
ok()   { printf "${GREEN}✓${NC} ${1}\n"; }
warn() { printf "${YELLOW}!${NC} ${1}\n"; }
err()  { printf "${RED}✗${NC} ${1}\n" >&2; }

# ---------- 必要工具檢查 ----------
for cmd in node npm git pm2 cloudflared gh docker curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "找不到指令：$cmd（請先跑 scripts/setup-macmini.md）"
    exit 1
  fi
done

# ---------- (1) Backend CI ----------
step "拉最新 code"
git pull --ff-only
ok "git pull 完成"

step "安裝依賴 (npm ci)"
npm ci
ok "npm ci 完成"

# Prisma client 必須在 typecheck 前產生，否則 @prisma/client 沒型別 → tsc 報錯。
step "產生 Prisma client (db:generate)"
npm -w @carelink/api run db:generate
ok "prisma client 已產生"

step "Typecheck (@carelink/shared + @carelink/api)"
npm run typecheck
ok "typecheck 通過"

step "執行測試（--if-present，目前無 test 會跳過）"
npm test --workspaces --if-present
ok "測試通過"

step "編譯後端 (build:api)"
npm run build:api
ok "build:api 完成"

# ---------- (2) Infra ----------
step "啟動 infra（postgres + redis，docker compose）"
npm run infra:up
ok "infra 已啟動"

# ---------- (3) Prisma migrate (套用 schema 到 DB) ----------
step "Prisma migrate deploy"
npm -w @carelink/api run db:migrate
ok "migrate 完成"

# ---------- (4) pm2 reload ----------
step "pm2 reload（首次自動 start）"
if pm2 describe carelink-api >/dev/null 2>&1; then
  pm2 reload scripts/pm2.config.cjs --update-env
else
  pm2 start scripts/pm2.config.cjs
fi
pm2 save >/dev/null
ok "pm2 已就緒"

# ---------- (5) 等 /health ----------
step "等 backend /health 回 200（最多 30s）"
HEALTHY=0
for i in {1..30}; do
  if curl -fsS http://localhost:3000/health >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 1
done
if [ "$HEALTHY" -ne 1 ]; then
  err "backend 未在 30s 內回應 /health。請查 'pm2 logs carelink-api'"
  exit 1
fi
ok "backend healthy"

# ---------- (6) Cloudflare quick tunnel ----------
step "重啟 cloudflared quick tunnel"
pkill -f "cloudflared tunnel" >/dev/null 2>&1 || true
sleep 1

LOG=/tmp/carelink-tunnel.log
: > "$LOG"
nohup cloudflared tunnel --url http://localhost:3000 >"$LOG" 2>&1 &
TUNNEL_PID=$!
ok "cloudflared 已啟動 (pid=$TUNNEL_PID, log=$LOG)"

step "抓 trycloudflare URL（最多 30s）"
URL=""
for i in {1..30}; do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)
  if [ -n "$URL" ]; then break; fi
  sleep 1
done
if [ -z "$URL" ]; then
  err "30s 內沒抓到 tunnel URL。請查 $LOG"
  exit 1
fi
ok "Tunnel URL: ${GREEN}${URL}${NC}"

# 簡單驗證 tunnel 通了
step "驗證 tunnel → backend"
if curl -fsS "${URL}/health" >/dev/null 2>&1; then
  ok "tunnel 可達 backend"
else
  warn "tunnel URL 暫時無法連到 /health（可能還在 propagate）— 繼續觸發 deploy"
fi

# ---------- (7) 觸發 Pages 部署 ----------
step "觸發 GitHub Actions deploy-web.yml（targets master）"
gh workflow run deploy-web.yml -f apiBaseUrl="$URL"
ok "workflow 已觸發"

cat <<EOF

${GREEN}========================================${NC}
${GREEN}  全部完成${NC}
${GREEN}========================================${NC}

  Backend (本機)  : http://localhost:3000
  Tunnel (公開)    : ${URL}
  前端 (CDN 更新後): https://leo04264.github.io/CareLink/
  Actions 進度    : https://github.com/leo04264/CareLink/actions

  預期 4–5 分鐘後前端會打到本機 backend。

  常用：
    pm2 logs carelink-api          # 看 api log
    pm2 logs carelink-workers      # 看 worker log
    tail -f $LOG                   # 看 tunnel log
    pm2 restart carelink-api       # 只重啟 api
    ./scripts/dev-tunnel.sh        # 重跑整套（會換新 URL + 重 deploy）

EOF
