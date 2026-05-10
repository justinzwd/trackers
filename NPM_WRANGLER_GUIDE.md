# npm 和 Wrangler 命令速查手册

## 📚 目录

1. [npm 基础命令](#npm-基础命令)
2. [项目中的 npm Scripts](#项目中的-npm-scripts)
3. [Wrangler 基础命令](#wrangler-基础命令)
4. [D1 数据库操作](#d1-数据库操作)
5. [Cloudflare Workers 部署](#cloudflare-workers-部署)
6. [Cloudflare Pages 部署](#cloudflare-pages-部署)
7. [完整部署流程](#完整部署流程)
8. [常见问题和故障排查](#常见问题和故障排查)
9. [高级技巧](#高级技巧)

---

## npm 基础命令

### npm 是什么？

npm (Node Package Manager) 是 Node.js 的包管理器，用于：
- 安装和管理项目依赖
- 运行脚本命令
- 发布和管理包

### 常用命令速查

| 命令 | 说明 | 示例 |
|------|------|------|
| `npm install` | 安装 package.json 中的所有依赖 | `npm install` |
| `npm install <包名>` | 安装指定包 | `npm install react` |
| `npm install -g <包名>` | 全局安装包 | `npm install -g wrangler` |
| `npm install --save-dev <包名>` | 安装为开发依赖 | `npm install --save-dev vite` |
| `npm run <脚本名>` | 运行 package.json 中的脚本 | `npm run dev` |
| `npm run` | 列出所有可用脚本 | `npm run` |
| `npm update` | 更新依赖到最新版本 | `npm update` |
| `npm outdated` | 检查哪些包需要更新 | `npm outdated` |
| `npm cache clean --force` | 清除 npm 缓存 | `npm cache clean --force` |
| `npm init -y` | 快速创建 package.json | `npm init -y` |

### package.json 结构

```json
{
  "name": "trackers-app",           // 项目名称
  "version": "1.0.0",               // 版本号
  "type": "module",                 // 模块类型 (module/commonjs)
  "scripts": {                      // 可运行脚本
    "dev": "vite",                  // 开发命令
    "build": "vite build"           // 构建命令
  },
  "dependencies": {                 // 运行时依赖
    "react": "^18.3.1"
  },
  "devDependencies": {              // 开发依赖
    "vite": "^5.2.8"
  }
}
```

### 依赖版本号说明

| 符号 | 含义 | 示例 |
|------|------|------|
| `^1.2.3` | 允许更新到 1.x.x 最新版（不包含 2.0.0） | `^18.3.1` → `18.3.2` ✓, `19.0.0` ✗ |
| `~1.2.3` | 允许更新到 1.2.x 最新版（不包含 1.3.0） | `~18.3.1` → `18.3.2` ✓, `18.4.0` ✗ |
| `1.2.3` | 固定版本，不更新 | `1.2.3` 始终是 `1.2.3` |
| `*` | 接受任何版本 | （不推荐生产环境使用） |
| `latest` | 始终使用最新版本 | （不推荐生产环境使用） |

---

## 项目中的 npm Scripts

### 前端项目 (根目录 package.json)

| 命令 | 完整命令 | 作用 |
|------|----------|------|
| `npm run dev` | `vite` | 启动前端开发服务器 |
| `npm run dev:full` | `concurrently "wrangler pages dev ..." "vite"` | 同时启动前端和后端 |
| `npm run build` | `vite build` | 构建生产版本 |
| `npm run preview` | `vite preview` | 预览生产构建 |

**使用示例**：

```bash
# 启动前端开发
npm run dev
# 输出: ➜  Local:   http://localhost:5173/

# 构建生产版本
npm run build
# 输出: dist/index.html  0.46 kB
#       dist/assets/...  XX kB

# 预览构建结果
npm run preview
# 输出: ➜  Local:   http://localhost:4173/
```

### 后端项目 (worker/package.json)

| 命令 | 完整命令 | 作用 |
|------|----------|------|
| `npm run dev` | `wrangler dev` | 启动本地 Worker 开发服务器 |
| `npm run deploy` | `wrangler deploy` | 部署到 Cloudflare Workers |
| `npm run db:create` | `wrangler d1 create trackers-db` | 创建新的 D1 数据库 |
| `npm run db:init` | `wrangler d1 execute trackers-db --file=../schema.sql` | 初始化本地数据库 |
| `npm run db:migrate` | `wrangler d1 execute trackers-db --file=../schema.sql --remote` | 迁移远程数据库 |

**使用示例**：

```bash
cd worker

# 启动本地开发
npm run dev
# 输出: ⎔ Starting local server...
#       [wrangler:inf] Ready on http://localhost:8787

# 部署到生产环境
npm run deploy
# 输出: Published trackers-api (1.23 sec)
#       https://trackers-api.your-account.workers.dev

# 初始化本地数据库
npm run db:init
# 输出: 🌀 Executing on local database trackers-db
#       ✅ Executed 12 commands in 15ms
```

---

## Wrangler 基础命令

### Wrangler 是什么？

Wrangler 是 Cloudflare 官方的命令行工具，用于：
- 本地开发和测试 Workers
- 部署 Workers 到 Cloudflare
- 管理 D1 数据库
- 管理 KV、R2 等存储服务

### 安装 Wrangler

```bash
# 全局安装（推荐）
npm install -g wrangler

# 或者在项目中安装
npm install --save-dev wrangler

# 验证安装
wrangler --version
```

### 登录 Cloudflare

```bash
# 登录（会打开浏览器授权）
wrangler login

# 登出
wrangler logout

# 查看当前登录用户
wrangler whoami
```

### wrangler.toml 配置文件

```toml
# Worker 名称
name = "trackers-api"

# 入口文件
main = "index.js"

# 兼容日期（影响可用 API）
compatibility_date = "2024-03-20"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"                              # 代码中使用 env.DB
database_name = "trackers-db"               # 数据库名称
database_id = "1f6e34b0-281c-42c7-9da5-ea686a31bea5"  # 数据库唯一ID

# 本地开发配置
[dev]
port = 8787                  # 本地端口
local_protocol = "http"      # 协议
```

### 常用 Wrangler 命令

#### 开发相关

| 命令 | 说明 | 示例 |
|------|------|------|
| `wrangler dev` | 启动本地开发服务器 | `wrangler dev` |
| `wrangler dev --port 3000` | 指定端口启动 | `wrangler dev --port 3000` |
| `wrangler dev --local` | 使用完全本地模式 | `wrangler dev --local` |
| `wrangler tail` | 实时查看 Worker 日志 | `wrangler tail` |

**示例**：

```bash
# 启动开发服务器
wrangler dev
# 输出:
# ⎔ Starting local server...
# [wrangler:inf] Ready on http://localhost:8787

# 启动开发服务器（指定端口）
wrangler dev --port 9000
# 输出:
# [wrangler:inf] Ready on http://localhost:9000

# 实时查看日志（需要先运行 wrangler dev 或部署后）
wrangler tail
# 输出:
# [wrangler:tail] Real-time logs
# [log] GET /api/water 200
```

#### 部署相关

| 命令 | 说明 | 示例 |
|------|------|------|
| `wrangler deploy` | 部署到 Cloudflare | `wrangler deploy` |
| `wrangler deploy --env production` | 部署到指定环境 | `wrangler deploy --env production` |
| `wrangler versions list` | 查看部署历史 | `wrangler versions list` |
| `wrangler rollback <version>` | 回滚到指定版本 | `wrangler rollback 5` |

**示例**：

```bash
# 部署
wrangler deploy
# 输出:
# ⛅️ wrangler 3.34.0
# Uploading trackers-api...
# Published trackers-api (1.23 sec)
#   https://trackers-api.your-account.workers.dev

# 查看部署历史
wrangler versions list
# 输出:
# ID     Created At      Tags
# 123    2024-05-10      production
# 122    2024-05-09      production

# 回滚
wrangler rollback 122
# 输出:
# ⛅️ Rolling back to version 122...
```

#### 项目管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `wrangler whoami` | 查看当前登录账户 | `wrangler whoami` |
| `wrangler list` | 列出所有 Workers | `wrangler list` |
| `wrangler delete <name>` | 删除指定 Worker | `wrangler delete my-worker` |

**示例**：

```bash
# 查看所有 Workers
wrangler list
# 输出:
# tracker-api
# my-worker
# test-worker

# 删除 Worker
wrangler delete test-worker
# 输出:
# ✅ Successfully deleted test-worker
```

---

## D1 数据库操作

### D1 是什么？

Cloudflare D1 是 Cloudflare 提供的 SQLite 数据库服务，特点：
- 基于 SQLite
- 全球分布式部署
- 免费额度：5M 读写/天，500MB 存储
- 与 Worker 无缝集成

### 数据库管理命令

#### 创建数据库

```bash
# 方式一：使用命令创建
wrangler d1 create <database-name>

# 示例
wrangler d1 create trackers-db
# 输出:
# 🌀 Creating database with name "trackers-db"
# ✅ Successfully created DB!
#
# [[d1_databases]]
# binding = "DB"
# database_name = "trackers-db"
# database_id = "1f6e34b0-281c-42c7-9da5-ea686a31bea5"
#
# Add this to your wrangler.toml to connect:
# wrangler d1 execute trackers-db --remote --command="SELECT 1"

# 方式二：使用 npm script（项目中已配置）
npm run db:create
```

**注意**：创建后需要将返回的 `database_id` 复制到 `wrangler.toml` 中。

#### 列出数据库

```bash
# 列出所有 D1 数据库
wrangler d1 list

# 输出:
# 📃 D1 Databases
# ┌────────────────┬─────────────────────────────────────┬──────┐
# │ name           │ id                                  │ rows │
# ├────────────────┼─────────────────────────────────────┼──────┤
# │ trackers-db    │ 1f6e34b0-281c-42c7-9da5-ea686a31bea5 │ 156  │
# └────────────────┴─────────────────────────────────────┴──────┘
```

#### 删除数据库

```bash
# ⚠️ 警告：此操作不可逆！
wrangler d1 delete <database-name>

# 示例
wrangler d1 delete test-db
# 输出:
# ⚠️  Are you sure you want to delete 'test-db'?
# This action is irreversible.
# Enter 'y' to confirm: y
# ✅ Successfully deleted D1 database
```

### 执行 SQL 命令

#### 执行 SQL 文件

```bash
# 本地数据库
wrangler d1 execute <database-name> --file=<sql-file>

# 远程数据库
wrangler d1 execute <database-name> --remote --file=<sql-file>

# 示例（项目中）
npm run db:init     # 初始化本地数据库
npm run db:migrate  # 迁移远程数据库
```

#### 执行单条 SQL 命令

```bash
# 本地数据库
wrangler d1 execute <database-name> --command="<sql>"

# 远程数据库
wrangler d1 execute <database-name> --remote --command="<sql>"

# 示例
# 查询所有喝水记录
wrangler d1 execute trackers-db --remote --command="SELECT * FROM water_records"

# 添加一条记录
wrangler d1 execute trackers-db --remote --command="INSERT INTO water_records (amount) VALUES (100)"

# 删除记录
wrangler d1 execute trackers-db --remote --command="DELETE FROM water_records WHERE id = 1"
```

#### 查看查询结果

```bash
# 查询并格式化输出
wrangler d1 execute trackers-db --remote --command="SELECT * FROM water_records LIMIT 5"

# 输出:
# 🌀 Executing on remote database trackers-db
# 🚣 Executed 1 commands in 23ms
#
# id  amount  recorded_at
# ───  ──────  ─────────────────────
# 123  100     2024-05-10 08:30:00
# 122  550     2024-05-10 07:15:00
# 121  200     2024-05-10 06:00:00
```

### 交互式查询（类似 MySQL 客户端）

```bash
# 本地数据库交互模式
wrangler d1 console <database-name>

# 远程数据库交互模式
wrangler d1 console <database-name> --remote

# 示例
wrangler d1 console trackers-db --remote
# 输出:
# 🌀 Connecting to remote database trackers-db
# Enter an SQL query at the prompt to execute it.
# Type ".quit" to exit.
#
# > SELECT * FROM water_records;
# > .quit
```

### 数据导入导出

#### 导出数据

```bash
# 导出为 SQL 文件
wrangler d1 export <database-name> --remote --output=backup.sql

# 示例
wrangler d1 export trackers-db --remote --output=backup-20240510.sql
# 输出:
# 🌀 Exporting database 'trackers-db'...
# ✅ Exported 156 rows to backup-20240510.sql
```

#### 导入数据

```bash
# 导入 SQL 文件
wrangler d1 execute <database-name> --remote --file=backup.sql

# 示例
wrangler d1 execute trackers-db --remote --file=backup-20240510.sql
# 输出:
# 🌀 Executing on remote database trackers-db
# ✅ Executed 12 commands in 45ms
```

### 数据库备份策略

```bash
# 1. 创建备份（带日期）
DATE=$(date +%Y%m%d)
wrangler d1 export trackers-db --remote --output=backup-$DATE.sql

# 2. 查看所有备份
ls -l backup-*.sql

# 3. 恢复备份
wrangler d1 execute trackers-db --remote --file=backup-20240510.sql
```

### 常见 SQL 操作示例

```bash
# 查看表结构
wrangler d1 execute trackers-db --remote --command="PRAGMA table_info(water_records)"

# 查看所有表
wrangler d1 execute trackers-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

# 统计记录数
wrangler d1 execute trackers-db --remote --command="SELECT COUNT(*) FROM water_records"

# 清空表（保留表结构）
wrangler d1 execute trackers-db --remote --command="DELETE FROM water_records"

# 删除表
wrangler d1 execute trackers-db --remote --command="DROP TABLE IF EXISTS water_records"
```

---

## Cloudflare Workers 部署

### 部署前检查清单

- [ ] 代码已在本地测试通过
- [ ] `wrangler.toml` 配置正确
- [ ] 已登录 Cloudflare (`wrangler login`)
- [ ] 数据库 ID 配置正确
- [ ] 环境变量配置正确（如有）

### 部署到 Workers

```bash
# 进入 worker 目录
cd worker

# 部署
npm run deploy
# 或
wrangler deploy

# 输出示例:
# ⛅️ wrangler 3.34.0
# -------------------
# Uploading trackers-api...
# Published trackers-api (1.23 sec)
#   https://trackers-api.your-account.workers.dev
#
# Current Version ID: 12345678-1234-1234-1234-123456789012
```

### 部署后验证

```bash
# 测试 API
curl https://trackers-api.your-account.workers.dev/

# 测试具体接口
curl https://trackers-api.your-account.workers.dev/api/water

# 添加测试数据
curl -X POST https://trackers-api.your-account.workers.dev/api/water \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

### 查看部署日志

```bash
# 实时查看日志
wrangler tail

# 只查看错误日志
wrangler tail --format pretty --level error

# 过滤特定路径
wrangler tail | grep "/api/water"
```

### 环境变量管理

#### 在 wrangler.toml 中配置

```toml
[vars]
API_KEY = "your-api-key"
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "trackers-db"
database_id = "..."
```

#### 使用密钥（敏感信息）

```bash
# 设置密钥
wrangler secret put API_KEY
# 提示输入值: ********

# 列出所有密钥
wrangler secret list

# 删除密钥
wrangler secret delete API_KEY
```

**在代码中使用**：
```javascript
export default {
  async fetch(request, env, ctx) {
    const apiKey = env.API_KEY  // 使用环境变量
    const db = env.DB            // 使用数据库绑定
    // ...
  }
}
```

### 多环境部署

```bash
# 部署到生产环境（默认）
wrangler deploy

# 部署到预发布环境
wrangler deploy --env staging

# 配置多个环境（wrangler.toml）
[env.staging]
name = "trackers-api-staging"

[env.production]
name = "trackers-api"
```

---

## Cloudflare Pages 部署

### Pages 是什么？

Cloudflare Pages 是 Cloudflare 的静态网站托管服务，用于部署前端应用。

### 部署方式一：使用 Wrangler 命令行

```bash
# 1. 构建前端
npm run build

# 2. 部署到 Pages
wrangler pages deploy dist --project-name=trackers-app

# 输出:
# ✨ Successfully published your Workers Site
#   https://trackers-app.pages.dev
```

### 部署方式二：上传部署

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Workers & Pages** → **Create application** → **Pages**
3. 选择 **Upload assets**
4. 上传 `dist` 文件夹中的内容
5. 点击 **Deploy**

### 部署方式三：Git 集成（自动部署）

1. 将代码推送到 GitHub
2. 在 Cloudflare Dashboard 中连接 GitHub 仓库
3. 配置构建设置：

```yaml
# Cloudflare Pages 构建设置
Build command: npm run build
Build output directory: dist
```

4. 每次推送到 main 分支自动部署

### Pages 配置文件

创建 `_headers` 文件（放在 `public/` 或 `dist/` 目录）：

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

创建 `_redirects` 文件：

```
/*  /index.html  200
```

### Pages Functions（服务端渲染）

如果需要在 Pages 中使用服务端逻辑，可以创建 Functions：

```bash
# 目录结构
functions/
└── api/
    └── water/
        └── index.js  # 处理 /api/water/*
```

```javascript
// functions/api/water/index.js
export async function onRequestGet(context) {
  const { env, request } = context
  // 处理 GET 请求
}

export async function onRequestPost(context) {
  const { env, request } = context
  // 处理 POST 请求
}
```

### Pages 自定义域名

```bash
# 添加自定义域名（通过 Dashboard）
# 1. 进入 Pages 项目设置
# 2. 选择 Custom domains
# 3. 添加域名
# 4. 配置 DNS 记录
```

---

## 完整部署流程

### 首次部署（从头开始）

#### 1. 准备环境

```bash
# 安装 Node.js（如果未安装）
# 访问 https://nodejs.org/ 下载安装

# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

#### 2. 设置项目

```bash
# 克隆或创建项目
cd trackers

# 安装前端依赖
npm install

# 安装后端依赖
cd worker
npm install

# 创建 D1 数据库
npm run db:create
# 复制返回的 database_id 到 wrangler.toml
```

#### 3. 初始化数据库

```bash
# 初始化本地数据库
npm run db:init

# 初始化远程数据库
npm run db:migrate
```

#### 4. 测试本地环境

```bash
# 终端1：启动后端
cd worker
npm run dev

# 终端2：启动前端
cd ..
npm run dev

# 访问 http://localhost:5173 测试
```

#### 5. 部署到生产环境

```bash
# 部署后端 Worker
cd worker
npm run deploy
# 记下返回的 URL

# 部署前端 Pages
cd ..
npm run build
wrangler pages deploy dist --project-name=trackers-app
# 记下返回的 URL
```

#### 6. 验证部署

```bash
# 测试后端 API
curl https://trackers-api.your-account.workers.dev/api/water

# 访问前端
# 打开浏览器访问 https://trackers-app.pages.dev
```

### 日常更新部署

```bash
# 1. 修改代码后测试
npm run dev  # 测试前端

# 2. 测试后端（如果修改了 API）
cd worker
npm run dev

# 3. 构建前端
cd ..
npm run build

# 4. 部署后端（如果需要）
cd worker
npm run deploy

# 5. 部署前端
cd ..
wrangler pages deploy dist --project-name=trackers-app
```

### 数据库结构变更流程

```bash
# 1. 修改 schema.sql

# 2. 本地测试
cd worker
npm run db:init  # 重置本地数据库
npm run dev

# 3. 部署到远程
npm run db:migrate  # 应用到远程数据库
npm run deploy      # 部署代码
```

---

## 常见问题和故障排查

### npm 相关问题

#### 问题：npm install 很慢

```bash
# 切换到淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或使用 nrm 管理
npm install -g nrm
nrm use taobao

# 恢复官方源
nrm use npm
```

#### 问题：npm install 报错

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 问题：依赖冲突

```bash
# 查看依赖树
npm ls

# 查看冲突的依赖
npm ls --depth=0

# 使用 npm-check-updates 更新
npx npm-check-updates -u
npm install
```

### Wrangler 相关问题

#### 问题：wrangler: command not found

```bash
# 全局安装
npm install -g wrangler

# 或使用 npx（不安装）
npx wrangler --version

# 检查环境变量
echo $PATH
```

#### 问题：wrangler login 失败

```bash
# 确保网络可访问 Cloudflare
curl https://dash.cloudflare.com

# 使用 API Token 登录
wrangler login --api-token <your-token>
```

#### 问题：部署失败

```bash
# 检查配置文件
cat wrangler.toml

# 查看详细错误
wrangler deploy --verbose

# 检查登录状态
wrangler whoami
```

#### 问题：D1 数据库连接失败

```bash
# 检查 database_id 是否正确
cat wrangler.toml | grep database_id

# 列出所有数据库
wrangler d1 list

# 测试连接
wrangler d1 execute trackers-db --remote --command="SELECT 1"
```

### 开发环境问题

#### 问题：端口被占用

```bash
# 查找占用端口的进程
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# 更改端口
npm run dev -- --port 3000
# 或修改 vite.config.js

# 或在 wrangler.toml 中修改
[dev]
port = 9000
```

#### 问题：API 请求失败

```bash
# 检查后端是否运行
curl http://localhost:8787/

# 检查代理配置
cat vite.config.js

# 查看网络请求
# 浏览器 F12 → Network 标签
```

### 部署后问题

#### 问题：部署后页面空白

```bash
# 检查构建是否成功
ls -la dist/

# 检查 API 地址是否正确
# 浏览器 F12 → Console 查看错误

# 检查 Workers 是否部署成功
curl https://your-worker.workers.dev/
```

#### 问题：CORS 错误

```bash
# 检查后端是否设置了 CORS 头
# worker/index.js 中应包含:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}
```

#### 问题：数据库迁移失败

```bash
# 检查 SQL 语法
sqlite3 test.db < schema.sql  # 本地测试

# 逐步执行 SQL
wrangler d1 execute trackers-db --remote --command="CREATE TABLE IF NOT EXISTS ..."
```

---

## 高级技巧

### 快捷命令别名

在 `~/.zshrc` 或 `~/.bashrc` 中添加：

```bash
# Worker 快捷命令
alias wd='wrangler dev'
alias wdd='wrangler d1 execute'
alias wdl='wrangler d1 list'

# 项目快捷命令
alias track-dev='cd ~/Downloads/trackers && npm run dev'
alias track-deploy='cd ~/Downloads/trackers/worker && npm run deploy'
alias track-migrate='cd ~/Downloads/trackers/worker && npm run db:migrate'

# 应用配置
source ~/.zshrc  # 或 source ~/.bashrc
```

### 自动化部署脚本

创建 `deploy.sh`：

```bash
#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始部署...${NC}"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}有未提交的更改，是否继续？(y/n)${NC}"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "取消部署"
    exit 1
  fi
fi

# 部署后端
echo -e "${GREEN}部署后端...${NC}"
cd worker
npm run deploy

# 构建前端
echo -e "${GREEN}构建前端...${NC}"
cd ..
npm run build

# 部署前端
echo -e "${GREEN}部署前端...${NC}"
wrangler pages deploy dist --project-name=trackers-app

echo -e "${GREEN}部署完成！${NC}"
```

使用方法：

```bash
chmod +x deploy.sh
./deploy.sh
```

### 监控和日志

```bash
# 实时查看 Worker 日志
wrangler tail --format pretty

# 只查看错误
wrangler tail --format pretty --level error

# 导出到文件
wrangler tail > logs.txt &

# 分析日志
wrangler tail --format json | jq '.outcome'
```

### 数据库性能优化

```bash
# 创建索引
wrangler d1 execute trackers-db --remote --command="CREATE INDEX IF NOT EXISTS idx_date ON water_records(DATE(recorded_at))"

# 查看查询计划
wrangler d1 execute trackers-db --remote --command="EXPLAIN QUERY PLAN SELECT * FROM water_records WHERE DATE(recorded_at) = '2024-05-10'"

# 分析表
wrangler d1 execute trackers-db --remote --command="ANALYZE"
```

### 多个项目管理

```bash
# 使用 wrangler.json 替代 wrangler.toml
# 在不同目录中使用不同的配置

# 指定配置文件
wrangler deploy --config wrangler.staging.toml

# 环境变量文件
# .dev.vars (本地开发，不提交到 git)
API_KEY=dev-key-123

# 生产环境使用 wrangler secret
wrangler secret put API_KEY
```

### 批量操作

```bash
# 批量删除旧版本
wrangler versions list | awk 'NR>2 {print $1}' | xargs -I {} wrangler delete {}

# 批量执行 SQL
for sql in migrations/*.sql; do
  wrangler d1 execute trackers-db --remote --file="$sql"
done
```

---

## 参考资源

- [npm 官方文档](https://docs.npmjs.com/)
- [Wrangler 官方文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
