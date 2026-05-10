# Trackers 项目架构详解

## 📚 目录

1. [项目整体架构](#项目整体架构)
2. [目录结构](#目录结构)
3. [路由系统](#路由系统)
4. [前后端交互](#前后端交互)
5. [如何新增工具页面](#如何新增工具页面)
6. [核心概念解释](#核心概念解释)

---

## 项目整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       前端 (React + Vite)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │     API      │      │
│  │  (页面组件)   │  │  (UI组件)     │  │  (API调用)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            后端 (Cloudflare Workers - JavaScript)            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           worker/index.js (API 接口处理)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Cloudflare D1 (SQLite 数据库)              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 架构分层说明

| 层级 | 技术 | 作用 |
|------|------|------|
| **展示层** | React + JSX | 用户界面，页面渲染 |
| **状态层** | React Hooks | 数据管理，响应式更新 |
| **通信层** | fetch API | 与后端 API 通信 |
| **业务层** | Cloudflare Workers | 处理业务逻辑，数据库操作 |
| **数据层** | Cloudflare D1 | 持久化存储 (SQLite) |

---

## 目录结构

```
trackers/                          # 项目根目录
│
├── src/                           # 前端源代码
│   ├── api/                       # API 调用封装
│   │   └── index.js              # 所有 API 请求函数
│   ├── components/                # 可复用组件
│   │   └── ProgressBar.jsx       # 进度条圆环组件
│   ├── pages/                     # 页面组件
│   │   ├── Home.jsx              # 主页（工具列表）
│   │   ├── WaterTracker.jsx      # 喝水记录页
│   │   ├── DinnerTracker.jsx     # 晚饭攒钱页
│   │   ├── BonusTracker.jsx      # Bonus 积分页
│   │   ├── ReadingTracker.jsx    # 读书记录页
│   │   └── *.css                 # 各页面对应的样式
│   ├── App.jsx                   # 路由配置
│   ├── App.css                   # 全局样式
│   ├── main.jsx                  # 应用入口
│   └── index.css                 # 基础样式
│
├── worker/                        # 后端 Worker
│   ├── index.js                  # Worker 入口，处理所有 API 请求
│   ├── package.json              # 后端依赖
│   └── wrangler.toml             # Cloudflare Workers 配置
│
├── functions/                     # Cloudflare Pages Functions (可选)
│   └── api/                      # API 路由
│
├── schema.sql                    # 数据库表结构定义
├── package.json                  # 前端依赖
├── vite.config.js                # Vite 构建配置
└── index.html                    # HTML 入口
```

---

## 路由系统

### 路由配置文件：`src/App.jsx`

```javascript
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />           // 主页
      <Route path="/water" element={<WaterTracker />} />    // 喝水记录
      <Route path="/dinner" element={<DinnerTracker />} />  // 晚饭攒钱
      <Route path="/bonus" element={<BonusTracker />} />    // Bonus 积分
      <Route path="/reading" element={<ReadingTracker />} /> // 读书记录
    </Routes>
  )
}
```

### 路由表

| 路径 | 页面 | 组件文件 | 说明 |
|------|------|----------|------|
| `/` | 主页 | `Home.jsx` | 工具列表入口 |
| `/water` | 喝水记录 | `WaterTracker.jsx` | 记录每日喝水量 |
| `/dinner` | 晚饭攒钱 | `DinnerTracker.jsx` | 记录晚饭花费和攒钱 |
| `/bonus` | Bonus 积分 | `BonusTracker.jsx` | 积分打卡系统 |
| `/reading` | 读书记录 | `ReadingTracker.jsx` | 书籍和章节进度追踪 |

### 路由跳转方式

**方式一：使用 Link 组件（推荐）**
```javascript
import { Link } from 'react-router-dom'

<Link to="/water">去喝水记录</Link>
```

**方式二：使用编程式导航**
```javascript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/water')
```

---

## 前后端交互

### 交互流程图

```
┌─────────────┐      1. 用户点击按钮      ┌─────────────┐
│   用户界面   │  ────────────────────>  │  事件处理函数 │
│  (React)    │                        │  (Page 组件)  │
└─────────────┘                        └─────────────┘
                                            │ 2. 调用 API 函数
                                            ▼
                                    ┌─────────────┐
                                    │  API 调用层  │
                                    │ (api/index)  │
                                    └─────────────┘
                                            │ 3. 发送 HTTP 请求
                                            ▼
                                    ┌─────────────┐
                                    │   后端 API   │
                                    │(Worker/JS)   │
                                    └─────────────┘
                                            │ 4. 查询数据库
                                            ▼
                                    ┌─────────────┐
                                    │   D1 数据库  │
                                    │  (SQLite)    │
                                    └─────────────┘
                                            │ 5. 返回数据
                                            ▼
                                    ┌─────────────┐
                                    │   后端 API   │
                                    └─────────────┘
                                            │ 6. 返回 JSON
                                            ▼
                                    ┌─────────────┐
                                    │  API 调用层  │
                                    └─────────────┘
                                            │ 7. 更新状态
                                            ▼
                                    ┌─────────────┐
                                    │  事件处理函数 │
                                    └─────────────┘
                                            │ 8. 重新渲染
                                            ▼
                                    ┌─────────────┐
                                    │   用户界面   │
                                    └─────────────┘
```

### 前端 API 层：`src/api/index.js`

**通用请求函数**
```javascript
const API_BASE = '/api'  // API 基础路径

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  return await response.json()
}
```

**API 函数示例（喝水记录）**
```javascript
// 获取喝水记录
export async function getWaterRecords(date = null) {
  const dateParam = date ? `?date=${date}` : ''
  return apiRequest(`/water${dateParam}`)
}

// 添加喝水记录
export async function addWaterRecord(amount) {
  return apiRequest(`/water`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  })
}

// 删除喝水记录
export async function deleteWaterRecord(recordId) {
  return apiRequest(`/water/${recordId}`, { method: 'DELETE' })
}
```

### 后端 API 层：`worker/index.js`

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 添加 CORS 头（允许跨域）
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }

    // 获取今日喝水记录
    if (url.pathname === '/api/water' && request.method === 'GET') {
      const query = `SELECT id, amount, recorded_at FROM water_records WHERE DATE(recorded_at) = DATE('now') ORDER BY recorded_at DESC`
      const result = await env.DB.prepare(query).all()
      return Response.json(result.results, { headers: corsHeaders })
    }

    // 添加喝水记录
    if (url.pathname === '/api/water' && request.method === 'POST') {
      const { amount } = await request.json()
      const result = await env.DB.prepare('INSERT INTO water_records (amount) VALUES (?)').bind(amount).run()
      return Response.json({ success: true, id: result.meta.last_row_id }, { headers: corsHeaders })
    }

    // 删除喝水记录
    if (url.pathname.match(/^\/api\/water\/\d+$/) && request.method === 'DELETE') {
      const recordId = url.pathname.split('/').pop()
      await env.DB.prepare('DELETE FROM water_records WHERE id = ?').bind(recordId).run()
      return Response.json({ success: true }, { headers: corsHeaders })
    }
  }
}
```

### 开发环境代理配置：`vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788',  // 代理到本地 Worker
        changeOrigin: true
      }
    }
  }
})
```

**作用**：前端请求 `/api/*` 会被转发到 `http://localhost:8788/api/*`（本地 Worker）

### 完整交互示例

```javascript
// 1. 用户点击按钮
<button onClick={() => handleAddWater(100)}>+100ml</button>

// 2. 前端处理函数 (WaterTracker.jsx)
async function handleAddWater(amount) {
  // 调用 API
  await addWaterRecord(amount)
  // 重新加载数据
  await loadData()
}

// 3. API 调用层 (api/index.js)
export async function addWaterRecord(amount) {
  return apiRequest(`/water`, {
    method: 'POST',
    body: JSON.stringify({ amount })  // 发送 JSON 数据
  })
}

// 4. 后端处理 (worker/index.js)
const { amount } = await request.json()  // 解析 JSON
await env.DB.prepare('INSERT INTO water_records (amount) VALUES (?)')
  .bind(amount).run()
return Response.json({ success: true })

// 5. 数据库插入成功，返回结果
// 6. 前端收到响应，重新渲染页面
```

---

## 如何新增工具页面

### 完整步骤：以添加「运动记录」为例

#### 步骤 1：创建数据库表

在 `schema.sql` 中添加新表：

```sql
-- 运动记录表
CREATE TABLE IF NOT EXISTS exercise_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_type TEXT NOT NULL,      -- 运动类型（跑步、游泳等）
  duration INTEGER NOT NULL,         -- 时长（分钟）
  calories INTEGER,                  -- 消耗卡路里
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exercise_records_recorded_at ON exercise_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_exercise_records_date ON exercise_records(DATE(recorded_at));
```

**执行数据库迁移**：
```bash
cd worker
npm run db:init      # 本地环境
npm run db:migrate   # 生产环境
```

#### 步骤 2：后端添加 API 接口

在 `worker/index.js` 中添加：

```javascript
// ============ 运动记录相关 API ============

// 获取今日运动记录
if (url.pathname === '/api/exercise' && request.method === 'GET') {
  try {
    const query = `
      SELECT id, exercise_type, duration, calories,
             datetime(recorded_at, 'localtime') as recorded_at
      FROM exercise_records
      WHERE DATE(recorded_at) = DATE('now')
      ORDER BY recorded_at DESC
    `
    const result = await env.DB.prepare(query).all()
    return Response.json(result.results, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}

// 添加运动记录
if (url.pathname === '/api/exercise' && request.method === 'POST') {
  try {
    const { exerciseType, duration, calories } = await request.json()

    if (!exerciseType || !duration) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders })
    }

    const query = `INSERT INTO exercise_records (exercise_type, duration, calories) VALUES (?, ?, ?)`
    const result = await env.DB.prepare(query).bind(exerciseType, duration, calories).run()

    return Response.json({
      success: true,
      id: result.meta?.last_row_id
    }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}

// 删除运动记录
if (url.pathname.match(/^\/api\/exercise\/\d+$/) && request.method === 'DELETE') {
  try {
    const recordId = url.pathname.split('/').pop()
    await env.DB.prepare('DELETE FROM exercise_records WHERE id = ?').bind(recordId).run()
    return Response.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}
```

#### 步骤 3：前端添加 API 调用函数

在 `src/api/index.js` 中添加：

```javascript
// ============ 运动记录相关 API ============

// 获取运动记录
export async function getExerciseRecords() {
  return apiRequest('/exercise')
}

// 添加运动记录
export async function addExerciseRecord(exerciseType, duration, calories = 0) {
  return apiRequest('/exercise', {
    method: 'POST',
    body: JSON.stringify({ exerciseType, duration, calories })
  })
}

// 删除运动记录
export async function deleteExerciseRecord(recordId) {
  return apiRequest(`/exercise/${recordId}`, { method: 'DELETE' })
}
```

#### 步骤 4：创建页面组件

创建文件 `src/pages/ExerciseTracker.jsx`：

```javascript
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getExerciseRecords, addExerciseRecord, deleteExerciseRecord } from '../api'
import './ExerciseTracker.css'

function ExerciseTracker() {
  const [records, setRecords] = useState([])
  const [exerciseType, setExerciseType] = useState('跑步')
  const [duration, setDuration] = useState('')

  // 加载数据
  useEffect(() => {
    loadRecords()
  }, [])

  async function loadRecords() {
    try {
      const data = await getExerciseRecords()
      setRecords(data)
    } catch (error) {
      console.error('加载失败:', error)
    }
  }

  async function handleAdd() {
    if (!duration) {
      alert('请输入运动时长')
      return
    }
    try {
      await addExerciseRecord(exerciseType, parseInt(duration))
      setDuration('')
      await loadRecords()
    } catch (error) {
      alert('添加失败')
    }
  }

  async function handleDelete(id) {
    if (confirm('确定删除这条记录吗？')) {
      try {
        await deleteExerciseRecord(id)
        await loadRecords()
      } catch (error) {
        alert('删除失败')
      }
    }
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="exercise-tracker">
      <Link to="/" className="back-btn">
        <span>←</span> 返回主页
      </Link>

      <h1>🏃 运动记录</h1>

      {/* 添加表单 */}
      <div className="form-section">
        <select
          value={exerciseType}
          onChange={e => setExerciseType(e.target.value)}
        >
          <option value="跑步">跑步</option>
          <option value="游泳">游泳</option>
          <option value="骑行">骑行</option>
          <option value="健身">健身</option>
          <option value="其他">其他</option>
        </select>

        <input
          type="number"
          placeholder="时长（分钟）"
          value={duration}
          onChange={e => setDuration(e.target.value)}
        />

        <button onClick={handleAdd}>添加</button>
      </div>

      {/* 记录列表 */}
      <div className="records-list">
        {records.length === 0 ? (
          <div className="empty">暂无记录</div>
        ) : (
          records.map(record => (
            <div key={record.id} className="record-item">
              <div className="record-info">
                <span className="type">{record.exercise_type}</span>
                <span className="duration">{record.duration} 分钟</span>
                <span className="time">{formatTime(record.recorded_at)}</span>
              </div>
              <button className="delete-btn" onClick={() => handleDelete(record.id)}>
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ExerciseTracker
```

#### 步骤 5：创建页面样式

创建文件 `src/pages/ExerciseTracker.css`：

```css
.exercise-tracker {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  background: #f0f0f0;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  margin-bottom: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.form-section {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.form-section select,
.form-section input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  flex: 1;
}

.form-section button {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 10px;
}

.record-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.type {
  font-weight: bold;
  color: #333;
}

.duration {
  color: #667eea;
}

.time {
  color: #999;
  font-size: 14px;
}

.delete-btn {
  padding: 5px 10px;
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background: #fee;
  color: #ff6b6b;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
```

#### 步骤 6：添加路由配置

修改 `src/App.jsx`：

```javascript
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WaterTracker from './pages/WaterTracker'
import DinnerTracker from './pages/DinnerTracker'
import BonusTracker from './pages/BonusTracker'
import ReadingTracker from './pages/ReadingTracker'
import ExerciseTracker from './pages/ExerciseTracker'  // 新增

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/water" element={<WaterTracker />} />
      <Route path="/dinner" element={<DinnerTracker />} />
      <Route path="/bonus" element={<BonusTracker />} />
      <Route path="/reading" element={<ReadingTracker />} />
      <Route path="/exercise" element={<ExerciseTracker />} />  {/* 新增 */}
    </Routes>
  )
}

export default App
```

#### 步骤 7：在主页添加入口

修改 `src/pages/Home.jsx`：

```javascript
import { Link } from 'react-router-dom'

function Home() {
  const tools = [
    { id: 'water', name: '喝水记录', icon: '💧' },
    { id: 'dinner', name: '晚饭攒钱', icon: '🍽️' },
    { id: 'bonus', name: 'Bonus 积分', icon: '🎁' },
    { id: 'reading', name: '读书记录', icon: '📚' },
    { id: 'exercise', name: '运动记录', icon: '🏃' },  // 新增
  ]

  return (
    <div className="home">
      <h1>工具集</h1>
      <div className="tool-grid">
        {tools.map(tool => (
          <Link key={tool.id} to={`/${tool.id}`} className="tool-btn">
            <span>{tool.icon}</span>
            <span>{tool.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
```

### 新增页面修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `schema.sql` | 修改 | 添加新数据库表 |
| `worker/index.js` | 修改 | 添加后端 API 接口 |
| `src/api/index.js` | 修改 | 添加前端 API 调用函数 |
| `src/pages/NewTracker.jsx` | **新建** | 创建新页面组件 |
| `src/pages/NewTracker.css` | **新建** | 创建页面样式 |
| `src/App.jsx` | 修改 | 添加路由配置 |
| `src/pages/Home.jsx` | 修改 | 添加主页入口 |

---

## 核心概念解释

### 1. React 组件

**什么是组件？**
组件是 React 的基本构建单元，类似乐高积木。每个组件是一个函数，返回一段 HTML（JSX）。

**组件结构**：
```javascript
function MyComponent() {
  // 1. 状态管理（数据）
  const [data, setData] = useState([])

  // 2. 副作用（加载数据）
  useEffect(() => {
    loadData()
  }, [])

  // 3. 事件处理函数
  function handleClick() {
    // 处理点击
  }

  // 4. 返回 UI
  return (
    <div className="my-component">
      <h1>标题</h1>
      <button onClick={handleClick}>点击我</button>
    </div>
  )
}
```

### 2. React Hooks

| Hook | 作用 | 示例 |
|------|------|------|
| `useState` | 管理组件内部状态 | `const [count, setCount] = useState(0)` |
| `useEffect` | 处理副作用（数据加载、订阅） | `useEffect(() => { loadData() }, [])` |
| `useRef` | 保存可变值（不触发重新渲染） | `const canvasRef = useRef(null)` |

**useState 示例**：
```javascript
// 定义状态
const [records, setRecords] = useState([])  // records 是当前值，setRecords 是更新函数

// 更新状态
setRecords(newRecords)  // 直接设置新值
setRecords(prev => [...prev, newRecord])  // 基于旧值计算新值
```

**useEffect 示例**：
```javascript
// 组件挂载时执行一次（类似 componentDidMount）
useEffect(() => {
  loadData()
}, [])

// 当依赖项变化时执行
useEffect(() => {
  drawChart(data)
}, [data])  // data 变化时重新执行

// 组件卸载时清理
useEffect(() => {
  const timer = setInterval(() => {}, 1000)
  return () => clearInterval(timer)  // 清理函数
}, [])
```

### 3. JSX 语法

JSX 是 JavaScript 的扩展语法，允许在 JS 中写类似 HTML 的代码。

| JSX | JavaScript | 说明 |
|-----|------------|------|
| `<div>文本</div>` | `React.createElement('div', null, '文本')` | 创建元素 |
| `className="box"` | `class="box"` | CSS 类名（JSX 用 className） |
| `{variable}` | | 插入变量 |
| `{variable > 0 ? '是' : '否'}` | | 三元表达式 |
| `{items.map(item => <div>{item}</div>)}` | | 列表渲染 |
| `onClick={handleClick}` | `onclick="handleClick()"` | 事件处理 |

**示例**：
```jsx
function Example() {
  const name = '张三'
  const items = ['苹果', '香蕉', '橙子']
  const count = 5

  return (
    <div className="container">
      <h1>你好, {name}!</h1>
      <p>你选择了 {count} 个项目</p>

      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {count > 10 ? <p>太多了！</p> : <p>还可以</p>}
    </div>
  )
}
```

### 4. fetch API

fetch 是浏览器内置的 HTTP 请求方法。

**基本用法**：
```javascript
// GET 请求
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error))

// POST 请求
fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: '张三', age: 25 })
})
  .then(response => response.json())
  .then(data => console.log(data))

// async/await 写法（更推荐）
async function getData() {
  try {
    const response = await fetch('/api/data')
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
  }
}
```

### 5. 路由 (React Router)

| 组件 | 作用 |
|------|------|
| `BrowserRouter` | 路由容器，包裹整个应用 |
| `Routes` | 路由容器，包含所有 Route |
| `Route` | 单个路由，定义路径和组件 |
| `Link` | 声明式导航，替代 `<a>` 标签 |
| `useNavigate` | 编程式导航，在函数中跳转 |

**示例**：
```jsx
import { Routes, Route, Link, useNavigate } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}

function Home() {
  return (
    <div>
      <h1>首页</h1>
      <Link to="/about">关于我们</Link>  {/* 声明式导航 */}
    </div>
  )
}

function About() {
  const navigate = useNavigate()

  function goHome() {
    navigate('/')  {/* 编程式导航 */}
  }

  return (
    <div>
      <h1>关于</h1>
      <button onClick={goHome}>返回首页</button>
    </div>
  )
}
```

### 6. CSS 模块化

每个页面可以有自己的 CSS 文件，通过 `import` 引入。

```jsx
// MyComponent.jsx
import './MyComponent.css'  // 引入样式

function MyComponent() {
  return <div className="my-component">内容</div>
}
```

```css
/* MyComponent.css */
.my-component {
  padding: 20px;
  background: white;
  border-radius: 8px;
}
```

---

## 开发流程总结

### 本地开发完整流程

```bash
# 1. 安装前端依赖
npm install

# 2. 配置后端
cd worker
npm install

# 3. 初始化本地数据库
npm run db:init

# 4. 启动后端 Worker（终端1）
npm run dev
# 此时运行在 http://localhost:8787

# 5. 启动前端（终端2，返回项目根目录）
cd ..
npm run dev
# 此时运行在 http://localhost:5173
```

### 修改代码后的热更新

| 修改内容 | 是否需要重启 | 说明 |
|----------|--------------|------|
| 前端页面/样式 | ❌ 不需要 | Vite 自动热更新 |
| 前端 API 函数 | ❌ 不需要 | 自动热更新 |
| 后端 API 逻辑 | ✅ 需要重启 | 按 Ctrl+C 停止，重新 `npm run dev` |
| 数据库表结构 | ✅ 需要重新执行 | `npm run db:init` |

---

## 常见问题

### Q1: 页面白屏怎么办？

检查步骤：
1. 打开浏览器控制台（F12）查看错误
2. 检查 API 是否正常（访问 http://localhost:8787/）
3. 检查路由配置是否正确

### Q2: 数据保存不成功？

检查步骤：
1. 确认后端 Worker 正在运行
2. 查看后端控制台是否有错误
3. 检查数据库表是否已创建

### Q3: 样式不生效？

检查步骤：
1. 确认 CSS 文件已正确 import
2. 检查 class 名称是否拼写正确
3. 清除浏览器缓存

---

## 扩展阅读

- [React 官方文档](https://react.dev/)
- [React Router 文档](https://reactrouter.com/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
