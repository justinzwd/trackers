# Trackers App - 工具集应用

一个基于 React + Cloudflare Workers + D1 的工具集网页应用，支持数据持久化到关系型数据库。

## 技术栈

- **前端**: React 18 + Vite + React Router
- **后端**: Cloudflare Workers (Hono.js)
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages (前端) + Cloudflare Workers (后端)

## 项目结构

```
trackers/
├── src/                    # React 前端代码
│   ├── api/               # API 调用封装
│   ├── components/        # React 组件
│   ├── pages/             # 页面组件
│   ├── App.jsx            # 主应用组件
│   ├── main.jsx           # 入口文件
│   └── index.css          # 全局样式
├── worker/                # Cloudflare Workers 后端
│   ├── index.js           # Worker 入口
│   ├── package.json       # Worker 依赖
│   └── wrangler.toml      # Worker 配置
├── schema.sql             # D1 数据库表结构
├── package.json           # 前端依赖
├── vite.config.js         # Vite 配置
└── index.html             # HTML 入口
```

## 数据库设计

### water_records - 喝水记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| amount | INTEGER | 喝水量（毫升） |
| recorded_at | DATETIME | 记录时间 |

**设计理念**：
- 每个工具单独一张表，简单直接
- 无用户概念，所有记录共享
- 无外键关联，表结构独立

## 快速开始

### 1. 安装前端依赖

```bash
npm install
```

### 2. 配置 Cloudflare Workers

首先安装 Wrangler CLI：

```bash
npm install -g wrangler
```

登录 Cloudflare：

```bash
wrangler login
```

### 3. 创建 D1 数据库

进入 worker 目录：

```bash
cd worker
npm install
```

创建数据库：

```bash
npm run db:create
```

执行后会返回数据库 ID，复制并更新 `worker/wrangler.toml` 中的 `database_id`。

### 4. 初始化数据库表结构

```bash
# 本地开发环境
npm run db:init

# 生产环境
npm run db:migrate
```

### 5. 本地开发

启动后端 Worker：

```bash
cd worker
npm run dev
```

启动前端（新终端）：

```bash
npm run dev
```

访问 http://localhost:5173

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/water` | 获取今日喝水记录 |
| GET | `/api/water?date=2024-05-09` | 获取指定日期记录 |
| GET | `/api/water/history` | 获取最近7天历史数据 |
| POST | `/api/water` | 添加记录 `{ "amount": 100 }` |
| DELETE | `/api/water/:recordId` | 删除记录 |

## 部署到 Cloudflare

### 1. 部署后端 (Workers)

```bash
cd worker
npm run deploy
```

部署成功后，你会看到类似这样的输出：
```
Published trackers-api (1.23 sec)
  https://trackers-api.your-account.workers.dev
```

**复制这个 Workers URL**（例如：`https://trackers-api.your-account.workers.dev`）

### 2. 配置前端 API 地址

有两种方式：

**方式一：使用环境变量（推荐）**

创建 `.env` 文件（或复制 `.env.example`）：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Workers URL：

```
VITE_WORKERS_URL=https://trackers-api.your-account.workers.dev
```

**方式二：直接修改代码**

编辑 `src/api/index.js`，找到这行：

```javascript
const WORKERS_URL = import.meta.env.VITE_WORKERS_URL || ''
```

改为：

```javascript
const WORKERS_URL = 'https://trackers-api.your-account.workers.dev'
```

### 3. 部署前端 (Pages)

```bash
npm run build
```

使用 Wrangler 部署：

```bash
# 如果还没全局安装 wrangler
npm install -g wrangler

# 部署到 Pages
wrangler pages deploy dist --project-name=trackers-app
```

### 4. 访问应用

部署成功后，你会看到：
```
✨ Successfully published your Workers Site
   https://trackers-app.pages.dev
```

访问这个 URL 即可使用你的应用。

### 5. 配置自定义域名 (可选)

1. 进入 Cloudflare Dashboard → Pages
2. 选择你的项目 → Custom domains
3. 添加你自己的域名
4. 按照指引配置 DNS

使用自定义域名可以让国内访问更稳定。

## 添加新工具

以添加"跑步记录"为例：

### 1. 创建新表

```sql
-- 在 schema.sql 中添加
CREATE TABLE IF NOT EXISTS run_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distance INTEGER NOT NULL,  -- 距离（米）
  duration INTEGER NOT NULL,  -- 时长（分钟）
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_run_records_recorded_at ON run_records(recorded_at);
```

### 2. 在 Worker 添加接口

```javascript
// worker/index.js

// 获取跑步记录
app.get('/api/run', async (c) => {
  const { DB } = c.env
  const dateQuery = c.req.query('date')

  let query = `SELECT id, distance, duration, datetime(recorded_at, 'localtime') as recorded_at FROM run_records`
  const params = []

  if (dateQuery) {
    query += ` WHERE DATE(recorded_at) = ?`
    params.push(dateQuery)
  } else {
    query += ` WHERE DATE(recorded_at) = DATE('now')`
  }

  query += ` ORDER BY recorded_at DESC`
  const result = DB.prepare(query).bind(...params).all()

  const formatted = result.results.map(r => ({
    id: r.id,
    distance: r.distance,
    duration: r.duration,
    time: new Date(r.recorded_at).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))

  return c.json(formatted)
})

// 添加跑步记录
app.post('/api/run', async (c) => {
  const { DB } = c.env
  const { distance, duration } = await c.req.json()

  if (!distance || !duration) {
    return c.json({ error: 'Invalid data' }, 400)
  }

  const result = DB.prepare('INSERT INTO run_records (distance, duration) VALUES (?, ?)')
    .bind(distance, duration)
    .run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

// 删除跑步记录
app.delete('/api/run/:recordId', (c) => {
  const { DB } = c.env
  const recordId = c.req.param('recordId')

  const result = DB.prepare('DELETE FROM run_records WHERE id = ?')
    .bind(recordId)
    .run()

  if (result.meta.changes === 0) {
    return c.json({ error: 'Record not found' }, 404)
  }

  return c.json({ success: true })
})
```

### 3. 在前端添加 API 调用

```javascript
// src/api/index.js
export async function getRunRecords(date = null) {
  const dateParam = date ? `?date=${date}` : ''
  return apiRequest(`/run${dateParam}`)
}

export async function addRunRecord(distance, duration) {
  return apiRequest(`/run`, {
    method: 'POST',
    body: JSON.stringify({ distance, duration }),
  })
}

export async function deleteRunRecord(recordId) {
  return apiRequest(`/run/${recordId}`, { method: 'DELETE' })
}
```

### 4. 创建前端页面

```jsx
// src/pages/RunTracker.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRunRecords, addRunRecord, deleteRunRecord } from '../api'

function RunTracker() {
  // 实现逻辑...
}

export default RunTracker
```

### 5. 添加路由

```jsx
// src/App.jsx
<Route path="/run" element={<RunTracker />} />
```

### 6. 在主页添加入口

```jsx
// src/pages/Home.jsx
const tools = [
  { id: 'water', name: '喝水记录', icon: '💧' },
  { id: 'run', name: '跑步记录', icon: '🏃' },
]
```

## 免费额度

| 服务 | 免费额度 |
|------|----------|
| Cloudflare Workers | 10万请求/天 |
| Cloudflare D1 | 5M 读写/天, 500MB 存储 |
| Cloudflare Pages | 无限带宽 |

## 注意事项

1. **国内访问**: 使用 Cloudflare CDN 全球加速，国内访问基本稳定
2. **数据备份**: D1 数据建议定期备份
3. **速率限制**: 超过免费额度可能需要付费
