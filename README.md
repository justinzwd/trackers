# Trackers App - 工具集应用

一个基于 React + Cloudflare Workers + D1 的工具集网页应用，支持数据持久化到关系型数据库。

D1 数据库
https://dash.cloudflare.com/f6aa285a8ab42aab882444b9ab2885a1/workers/d1

Workers and Pages
https://dash.cloudflare.com/f6aa285a8ab42aab882444b9ab2885a1/workers-and-pages

todo
[x] 有几张表的 id 自增主键太大了(可以看 sqlite_sequence 这张表)，在插入数据的时候注意id，并且修改已有的数据以及外键
[x] 加缓存，在退出页面前强制将数据持久化到远程数据库
[x] functions 文件夹有什么作用，为什么子文件夹里面的文件名是 [id].js 呢？

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

### dinner_records - 晚饭记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| spent | REAL | 实际花销（元） |
| saved | REAL | 攒钱金额（预算-花销） |
| recorded_at | DATETIME | 记录时间 |

### bonus_items - Bonus 积分项目表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 项目名称 |
| value | INTEGER | 单次奖励积分 |
| sort_order | INTEGER | 排序顺序 |
| created_at | DATETIME | 创建时间 |

### bonus_history - Bonus 积分历史记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| item_id | INTEGER | 关联的项目ID |
| item_name | TEXT | 项目名称（冗余存储） |
| amount | INTEGER | 奖励积分数 |
| recorded_at | DATETIME | 记录时间 |

**设计理念**：
- 每个工具单独一张表，简单直接
- 无用户概念，所有记录共享
- 无外键关联，表结构独立

之前：
用户操作 → await API写入 → await API重新读取 → 更新UI

现在：
页面加载 → localStorage缓存秒开 → 后台远程刷新
用户操作 → 更新state + localStorage（即时） → 操作入队列
退出页面 → sendBeacon批量同步队列到远程DB

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

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/water` | 获取今日喝水记录 |
| GET | `/api/water?date=2024-05-09` | 获取指定日期记录 |
| GET | `/api/water/history` | 获取最近7天历史数据 |
| POST | `/api/water` | 添加记录 `{ "amount": 100 }` |
| DELETE | `/api/water/:recordId` | 删除记录 |

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dinner` | 获取今日晚饭记录 |
| GET | `/api/dinner?all=true` | 获取所有记录 |
| POST | `/api/dinner` | 添加记录 `{ "spent": 15.5 }` |
| DELETE | `/api/dinner/:recordId` | 删除记录 |

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/bonus` | 获取所有数据 |
| GET | `/api/bonus?action=items` | 获取项目列表 |
| GET | `/api/bonus?action=history` | 获取历史记录 |
| GET | `/api/bonus?action=total` | 获取总积分 |
| POST | `/api/bonus` | 添加项目 `{ "name": "跑步", "value": 15 }` |
| POST | `/api/bonus?action=increment` | 增加次数 `{ "itemId": 1 }` |
| PUT | `/api/bonus?action=reorder` | 更新排序 `{ "items": [...] }` |
| DELETE | `/api/bonus?action=delete&id=1` | 删除项目 |
| DELETE | `/api/bonus?action=history&id=1` | 删除历史记录 |
| DELETE | `/api/bonus?action=clear-history` | 清空历史 |

## 本地开发环境部署

代码更新后，要在本地环境查看效果，按照以下步骤操作：

### 方式一：仅启动前端（快速预览）

如果你只需要预览前端 UI 变化（不涉及 API 或数据库变更）：

```bash
# 安装前端依赖（首次运行）
npm install

# 启动前端开发服务器
npm run dev
```

访问 http://localhost:5173

### 方式二：完整本地开发（前后端 + 数据库）

如果你修改了 API 接口或数据库相关代码：

#### 1. 准备后端环境

```bash
# 进入 worker 目录
cd worker

# 安装后端依赖（首次运行）
npm install

# 启动本地 Worker（使用本地 SQLite 数据库）
npm run dev
```

此时后端会运行在 http://localhost:8787，数据存储在本地 `.wrangler/state/v3/d1/miniflare-D1DatabaseObject` 中。

#### 2. 启动前端（新终端窗口）

```bash
# 返回项目根目录
cd ..

# 启动前端开发服务器
npm run dev
```

访问 http://localhost:5173

#### 3. 测试流程

- 前端会自动连接本地 Worker API（http://localhost:8787）
- 所有数据操作都会保存到本地 SQLite 数据库
- 修改代码后，前端会自动热重载
- Worker 修改后需要重启：在终端按 `Ctrl+C` 停止，然后重新 `npm run dev`

### 本地环境数据管理

```bash
cd worker

# 初始化本地数据库表结构
npm run db:init

# 查看本地数据库数据
npm run db:local
```

## 生产环境部署

代码更新后，要将变更部署到生产环境供所有人访问，按照以下步骤操作：

### ⚠️ 前置操作：关闭 GitHub 自动部署（如果已配置）

如果你之前在 Cloudflare Pages 绑定了 GitHub，需要先关闭自动部署，否则会和手动部署冲突：

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Workers & Pages** → 找到你的 Pages 项目
3. 点击项目 → **Settings** → **Build & deployments**
4. 找到 **Continuous Integration** 部分，选择 **None** 或删除 GitHub 集成
5. 或者直接删除整个 Pages 项目，重新创建

### 步骤 1：提交代码更改（本地保存）

```bash
# 查看修改内容
git status

# 添加所有修改
git add .

# 提交代码（可选，用于本地版本管理）
git commit -m "feat: 描述你的更改内容"

# 如需推送到远程仓库备份
git push
```

**注意**：手动部署不需要推送代码到 GitHub，推送只是为了本地备份。

### 步骤 2：部署后端 Workers API

```bash
# 进入 worker 目录
cd worker

# 部署到 Cloudflare Workers
npm run deploy
```

部署成功后，你会看到类似输出：
```
Published trackers-api (1.23 sec)
  https://trackers-api.your-account.workers.dev
```

**记住这个 URL**，这是你的生产环境 API 地址。

### 步骤 3：部署前端到 Cloudflare Pages

#### 方式一：使用 Wrangler 命令行部署（推荐）

```bash
# 返回项目根目录
cd ..

# 构建前端
npm run build

# 部署到 Pages
wrangler pages deploy dist --project-name=trackers-app
```

部署成功后会显示：
```
✨ Successfully published your Workers Site
   https://trackers-app.pages.dev
```

访问这个 URL 即可在生产环境查看你的应用。

#### 方式二：上传部署（无 Wrangler 环境）

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Workers & Pages** → **Create application** → **Pages**
3. 选择 **Upload assets**
4. 上传 `dist` 文件夹中的内容
5. 点击 **Deploy**

### 步骤 4：验证部署

1. **验证后端 API**：
   ```bash
   # 获取喝水记录
   curl https://trackers-api.your-account.workers.dev/api/water

   # 添加测试记录
  curl -X POST https://trackers-api.your-account.workers.dev/api/water \
    -H "Content-Type: application/json" \
    -d '{"amount": 100}'
   ```

2. **验证前端**：
   - 访问 https://trackers-app.pages.dev
   - 测试各项功能是否正常

### 步骤 5：配置自定义域名（可选，推荐）

**配置 Pages 自定义域名**：

1. 进入 Cloudflare Dashboard → Pages
2. 选择 `trackers-app` 项目 → Custom domains
3. 添加你自己的域名（如 `tools.example.com`）
4. 按照指引配置 DNS 记录

**配置 Workers 自定义域名**：

1. 进入 Cloudflare Dashboard → Workers
2. 选择 `trackers-api` → Triggers
3. 添加自定义域名

## 部署检查清单

在部署到生产环境前，请确认：

- [ ] 代码已提交到 Git
- [ ] 本地测试通过
- [ ] `schema.sql` 更新已应用到数据库（如需）
  ```bash
  cd worker
  npm run db:migrate  # 生产环境数据库迁移
  ```
- [ ] API 地址配置正确（`src/api/index.js` 或 `.env`）
- [ ] 生产环境数据已备份（如需要）

## 常见问题

### Q: 本地开发时数据不同步？

A: 本地使用 `.wrangler` 目录中的 SQLite 数据库，与生产环境的 D1 数据库完全独立。如需同步数据，可以：

```bash
# 导出生产数据到本地
cd worker
npm run db:export

# 导入本地数据到生产（谨慎操作）
npm run db:import
```

### Q: 部署后页面空白？

A: 检查：
1. API 地址是否正确配置
2. 浏览器控制台是否有错误
3. Workers 是否部署成功

### Q: 404 错误？

A: 确认：
1. API 路径正确（`/api/water`）
2. Workers URL 正确
3. 路由在 `worker/index.js` 中已定义

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
