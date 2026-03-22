# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev

```bash
npm run dev        # 同时启动前后端（推荐）
npm run server     # 仅后端 Express :3300
npm run client     # 仅前端 Vite :5173
```

## 架构

**两个进程，一个代理：**
- `server.js`：Express 服务器，将 `NeteaseCloudMusicApi` 的所有函数自动映射为 HTTP 路由（`login_qr_key` → `/login/qr/key`），运行在 `:3300`
- Vite 开发服务器运行在 `:5173`，将 `/api/*` 代理到 `:3300`（去掉 `/api` 前缀）
- 前端所有请求通过 `src/api.js` 发出，统一以 `/api` 为前缀

**前端状态流：**
`login` → `select` → `loading` → `result`

- `login`：QR 码扫码登录，每 2 秒轮询检查状态，成功后存 cookie 并进入 `select`
- `select`：选择 `day`（过去 24 小时）或 `week`（过去 7 天）
- `loading`/`result`：`App.jsx` 负责数据获取与处理，`Receipt.jsx` 是纯展示组件

**两种数据模式：**
- `day` 模式：调用听歌足迹 API（`listen/data/today/song` + `listen/data/realtime/report`）
- `week` 模式：调用用户听歌排行 API（`user/record?type=1`）

**流派标签：** 通过 `song/wiki/summary` 批量获取（每批 10 首），从 `SONG_PLAY_ABOUT_SONG_BASIC` block 的 `songTag` creative 中提取，失败时 fallback 为 top artists。

**鉴权：** 登录成功后 cookie 以 query 参数形式传递给每个 API 请求。

## 设计理念

简洁克制——只做必要的事，不过度设计。
