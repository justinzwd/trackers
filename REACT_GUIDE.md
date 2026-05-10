# React 开发完全指南

## 📚 目录

1. [React 是什么](#react-是什么)
2. [JSX 语法](#jsx-语法)
3. [组件](#组件)
4. [Props - 父子传值](#props---父子传值)
5. [State - 组件状态](#state---组件状态)
6. [useEffect - 副作用处理](#useeffect---副作用处理)
7. [事件处理](#事件处理)
8. [条件渲染](#条件渲染)
9. [列表渲染](#列表渲染)
10. [表单处理](#表单处理)
11. [useRef - 引用](#useref---引用)
12. [useMemo - 记忆化](#usememo---记忆化)
13. [useCallback - 记忆化函数](#usecallback---记忆化函数)
14. [Context API - 跨组件传值](#context-api---跨组件传值)
15. [自定义 Hooks](#自定义-hooks)
16. [性能优化技巧](#性能优化技巧)
17. [常见陷阱和最佳实践](#常见陷阱和最佳实践)

---

## React 是什么？

### 简单理解

想象你在搭积木：
- **React 就是一套积木系统**，每块积木都是一个"组件"
- 你可以把小块积木拼成大块，再拼成城堡
- 改变一块积木，整个城堡自动更新

### 核心思想

```
UI = f(state)

意思：界面 = 函数(状态)
状态变了 → 重新运行函数 → 界面自动更新
```

### 为什么用 React？

| 传统做法 | React 做法 |
|----------|------------|
| 手动找 DOM 元素修改 | 改数据，自动更新界面 |
| 代码复杂，容易出错 | 代码清晰，容易维护 |
| 页面卡顿 | 虚拟 DOM，性能更好 |

---

## JSX 语法

### 什么是 JSX？

JSX = JavaScript + XML（HTML 的变体）

**其实就是能在 JS 里写 HTML**

```jsx
// 普通写法
const element = React.createElement('h1', null, 'Hello')

// JSX 写法（更直观）
const element = <h1>Hello</h1>
```

### JSX 基本规则

#### 1. 必须有根元素

```jsx
// ❌ 错误：没有根元素
return (
  <h1>标题</h1>
  <p>内容</p>
)

// ✅ 正确：用 div 包裹
return (
  <div>
    <h1>标题</h1>
    <p>内容</p>
  </div>
)

// ✅ 也可以用 Fragment（不产生额外 DOM）
return (
  <>
    <h1>标题</h1>
    <p>内容</p>
  </>
)
```

#### 2. class 要写成 className

```jsx
// ❌ 错误：class 是 JS 关键字
<div class="container">...</div>

// ✅ 正确：用 className
<div className="container">...</div>
```

#### 3. 所有标签必须闭合

```jsx
// ❌ 错误：未闭合
<input>
<img src="logo.png">
<br>

// ✅ 正确
<input />
<img src="logo.png" />
<br />
```

#### 4. 大小写敏感

```jsx
// 小写 = HTML 标签
<div>    // <div> 标签
<span>   // <span> 标签

// 大写 = React 组件
<Button>  // Button 组件
<Form>    // Form 组件
```

#### 5. 插入变量用花括号 {}

```jsx
const name = '张三'
const age = 25
const isLoggedIn = true

// 插入字符串
<h1>你好，{name}!</h1>

// 插入数字
<p>今年 {age} 岁</p>

// 插入表达式
<p>明年 {age + 1} 岁</p>

// 插入布尔值
{isLoggedIn && <p>欢迎回来！</p>}

// 插入数组
<ul>{['苹果', '香蕉'].map(item => <li>{item}</li>)}</ul>
```

#### 6. style 是对象

```jsx
// ❌ 错误：字符串
<div style="color: red; font-size: 16px;">

// ✅ 正确：对象，属性名用驼峰
<div style={{ color: 'red', fontSize: '16px' }}>

// 可以提取出来
const boxStyle = {
  color: 'red',
  fontSize: '16px',
  padding: '10px'
}
<div style={boxStyle}>
```

#### 7. 注释

```jsx
// 在 HTML 里写注释
<div>
  {/* 这是 JSX 注释 */}
  <p>内容</p>
</div>
```

---

## 组件

### 什么是组件？

组件 = 可复用的 UI 片段

就像乐高积木：
- 一块积木 = 一个组件
- 多块积木拼起来 = 完整界面
- 可以重复使用

### 函数组件（最常用）

```jsx
// 最简单的组件
function Welcome() {
  return <h1>你好！</h1>
}

// 箭头函数写法
const Welcome = () => {
  return <h1>你好！</h1>
}

// 更简洁（单行）
const Welcome = () => <h1>你好！</h1>
```

### 带参数的组件

```jsx
// 接收参数（Props）
function Greeting(props) {
  return <h1>你好，{props.name}！</h1>
}

// 使用
<Greeting name="张三" />
// 显示：你好，张三！

// 解构写法（更常用）
function Greeting({ name, age }) {
  return (
    <div>
      <h1>你好，{name}！</h1>
      <p>今年 {age} 岁</p>
    </div>
  )
}

// 使用
<Greeting name="张三" age={25} />
```

### 组件嵌套

```jsx
// 父组件
function App() {
  return (
    <div className="app">
      <Header />
      <Content />
      <Footer />
    </div>
  )
}

// 子组件
function Header() {
  return <header>网站头部</header>
}

function Content() {
  return <main>主要内容</main>
}

function Footer() {
  return <footer>网站底部</footer>
}
```

---

## Props - 父子传值

### 什么是 Props？

Props = Properties（属性）
= 父组件传给子组件的数据

**类比**：就像函数的参数

```jsx
// 函数
function sayHello(name) {
  console.log('你好，' + name)
}
sayHello('张三')

// React 组件
function Greeting({ name }) {
  return <h1>你好，{name}！</h1>
}
<Greeting name="张三" />
```

### 基本用法

```jsx
// 子组件
function Product({ name, price, inStock }) {
  return (
    <div className="product">
      <h3>{name}</h3>
      <p>价格: ¥{price}</p>
      {inStock ? <span>有货</span> : <span>缺货</span>}
    </div>
  )
}

// 父组件使用
function App() {
  return (
    <div>
      <Product name="iPhone" price={5999} inStock={true} />
      <Product name="MacBook" price={12999} inStock={false} />
    </div>
  )
}
```

### Props 类型

```jsx
// 字符串
<Card title="标题" />

// 数字
<Button count={5} />

// 布尔值
<Dialog isOpen={true} />

// 数组
<List items={['苹果', '香蕉', '橙子']} />

// 对象
<User profile={{ name: '张三', age: 25 }} />

// 函数
<Button onClick={() => alert('点击了')} />

// JSX（组件）
<Header><Logo /></Header>
```

### Props 默认值

```jsx
function Button({ text, color = 'blue' }) {
  // 如果没传 color，默认是 blue
  return <button style={{ color }}>{text}</button>
}

// 使用
<Button text="确定" />          // color = blue (默认)
<Button text="取消" color="red" /> // color = red
```

### Props 只读

**重要**：Props 是只读的，不能修改！

```jsx
// ❌ 错误：不要修改 props
function Counter({ count }) {
  count = count + 1  // 错误！
  return <p>{count}</p>
}

// ✅ 正确：用 state 管理
function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount)
  return <p>{count}</p>
}
```

### children 属性

特殊的 prop，用于插槽内容

```jsx
// 子组件
function Card({ children, title }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="content">
        {children}  {/* 插入传入的内容 */}
      </div>
    </div>
  )
}

// 父组件使用
function App() {
  return (
    <Card title="用户信息">
      <p>姓名：张三</p>
      <p>年龄：25</p>
      <button>编辑</button>
    </Card>
  )
}
```

---

## State - 组件状态

### 什么是 State？

State = 组件内部的可变数据
= 组件的"记忆"

**类比**：
- Props = 别人告诉你的（不能改）
- State = 自己记下来的（可以改）

### useState 基础用法

```jsx
import { useState } from 'react'

function Counter() {
  // 1. 定义状态
  // count = 当前值
  // setCount = 更新函数
  const [count, setCount] = useState(0)  // 0 是初始值

  return (
    <div>
      <p>当前值: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
      <button onClick={() => setCount(count - 1)}>
        -1
      </button>
    </div>
  )
}
```

### useState 解读

```jsx
const [state, setState] = useState(initialValue)
//     ↓      ↓           ↓            ↓
//   当前值  更新函数     Hook        初始值
```

### 不同类型的 State

```jsx
function Form() {
  // 数字
  const [age, setAge] = useState(25)

  // 字符串
  const [name, setName] = useState('')

  // 布尔值
  const [isOpen, setIsOpen] = useState(false)

  // 数组
  const [items, setItems] = useState([])

  // 对象
  const [user, setUser] = useState({ name: '', age: 0 })

  // null
  const [data, setData] = useState(null)
}
```

### 更新 State

#### 方式一：直接设置新值

```jsx
const [count, setCount] = useState(0)

// 正确
setCount(5)
setCount(count + 1)

// 错误：不要直接修改
count = 5          // ❌ 不会触发更新
count.value = 5    // ❌ 不会触发更新
```

#### 方式二：基于旧值计算（函数式更新）

```jsx
const [count, setCount] = useState(0)

// 使用函数，参数是旧值
setCount(prev => prev + 1)

// 这在多次更新时很重要
function handleClick() {
  setCount(count + 1)    // 这三个可能只执行一次
  setCount(count + 1)
  setCount(count + 1)
}

// 正确写法
function handleClick() {
  setCount(prev => prev + 1)  // 每个都会执行
  setCount(prev => prev + 1)
  setCount(prev => prev + 1)
  // 结果：+3
}
```

### 更新对象

```jsx
const [user, setUser] = useState({
  name: '张三',
  age: 25,
  email: 'zhang@example.com'
})

// ❌ 错误：直接修改
user.name = '李四'
setUser(user)

// ✅ 正确：创建新对象
setUser({
  ...user,        // 复制旧值
  name: '李四'    // 覆盖修改的值
})

// ✅ 修改多个属性
setUser({
  ...user,
  name: '李四',
  age: 26
})
```

### 更新数组

```jsx
const [items, setItems] = useState(['苹果', '香蕉'])

// 添加元素
setItems([...items, '橙子'])

// 删除元素
setItems(items.filter(item => item !== '苹果'))

// 修改元素
setItems(items.map(item =>
  item === '苹果' ? '大苹果' : item
))

// 清空数组
setItems([])
```

### 常见错误

```jsx
function BadExample() {
  const [items, setItems] = useState([])

  // ❌ 错误1：直接修改
  items.push('新元素')

  // ❌ 错误2：在 render 中修改
  if (items.length === 0) {
    setItems(['默认值'])  // 无限循环！
  }

  // ❌ 错误3：忘记返回新值
  setItems(items)  // 还是同一个对象

  // ✅ 正确
  const addItem = () => {
    setItems([...items, '新元素'])
  }

  return <button onClick={addItem}>添加</button>
}
```

---

## useEffect - 副作用处理

### 什么是副作用？

副作用 = 组件渲染之外的操作

常见的副作用：
- 发送网络请求
- 设置定时器/清除定时器
- 操作 DOM
- 订阅/取消订阅
- 修改浏览器标题

### useEffect 基础用法

```jsx
import { useState, useEffect } from 'react'

function Timer() {
  const [count, setCount] = useState(0)

  // 每次 render 后执行
  useEffect(() => {
    console.log('组件渲染了')
  })

  // 只在依赖项变化时执行
  useEffect(() => {
    console.log('count 变化了:', count)
  }, [count])  // 依赖数组

  // 只在组件挂载时执行一次（类似 componentDidMount）
  useEffect(() => {
    console.log('组件挂载了')
  }, [])

  return <p>{count}</p>
}
```

### useEffect 的三种用法

#### 1. 每次渲染后执行

```jsx
useEffect(() => {
  console.log('每次渲染都执行')
})
// 等价于 componentDidMount + componentDidUpdate
```

#### 2. 指定依赖时执行

```jsx
const [count, setCount] = useState(0)
const [name, setName] = useState('')

useEffect(() => {
  console.log('count 变化了')
}, [count])  // 只有 count 变化时才执行

useEffect(() => {
  console.log('name 变化了')
}, [name])  // 只有 name 变化时才执行

useEffect(() => {
  console.log('count 或 name 变化了')
}, [count, name])  // 任意一个变化都执行
```

#### 3. 只执行一次

```jsx
useEffect(() => {
  console.log('只执行一次，类似组件挂载')
  // 适合：初始化、订阅、设置定时器
}, [])
```

### 清理副作用

```jsx
useEffect(() => {
  // 1. 做一些事情
  const timer = setInterval(() => {
    console.log('定时器运行中')
  }, 1000)

  // 2. 返回清理函数（组件卸载时执行）
  return () => {
    clearInterval(timer)  // 清除定时器
    console.log('清理完成')
  }
}, [])
```

### 实战示例

#### 示例1：数据获取

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/users/${userId}`)
        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error('获取失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])  // userId 变化时重新获取

  if (loading) return <p>加载中...</p>
  return <h1>{user?.name}</h1>
}
```

#### 示例2：修改页面标题

```jsx
function DocumentTitle() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    document.title = `点击了 ${count} 次`
  }, [count])

  return <button onClick={() => setCount(c => c + 1)}>
    点击次数: {count}
  </button>
}
```

#### 示例3：监听窗口大小

```jsx
function WindowSize() {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)

    // 清理：移除事件监听
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <p>窗口宽度: {width}px</p>
}
```

### 常见陷阱

#### 陷阱1：忘记依赖

```jsx
const [count, setCount] = useState(0)

// ❌ 错误：依赖数组为空，但用了 count
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1)  // count 永远是 0
  }, 1000)
}, [])

// ✅ 正确
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1)  // 使用函数式更新
  }, 1000)
}, [])

// 或
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1)
  }, 1000)
  return () => clearInterval(timer)
}, [count])  // 添加依赖
```

#### 陷阱2：无限循环

```jsx
const [data, setData] = useState(null)

// ❌ 错误：修改 state 又依赖它
useEffect(() => {
  setData({})  // 修改 state
}, [data])    // 依赖变化 → 重新执行 → 修改 state → 无限循环

// ✅ 正确：只在需要时执行
useEffect(() => {
  async function fetchData() {
    const result = await fetch('/api/data')
    setData(result)
  }
  fetchData()
}, [])  // 空依赖，只执行一次
```

---

## 事件处理

### 基本用法

```jsx
function Button() {
  function handleClick() {
    alert('点击了！')
  }

  return <button onClick={handleClick}>点击我</button>
}
```

### 事件类型

```jsx
function EventExample() {
  return (
    <div>
      {/* 点击事件 */}
      <button onClick={() => console.log('点击')}>Click</button>

      {/* 输入事件 */}
      <input onChange={e => console.log(e.target.value)} />

      {/* 提交事件 */}
      <form onSubmit={e => {
        e.preventDefault()
        console.log('提交')
      }}>

      {/* 鼠标事件 */}
      <div
        onMouseEnter={() => console.log('进入')}
        onMouseLeave={() => console.log('离开')}
      >
        鼠标事件
      </div>

      {/* 键盘事件 */}
      <input
        onKeyDown={e => {
          if (e.key === 'Enter') {
            console.log('回车')
          }
        }}
      />
    </div>
  )
}
```

### 事件对象

```jsx
function InputExample() {
  const [value, setValue] = useState('')

  function handleChange(event) {
    // event 是事件对象
    const target = event.target
    const value = target.value
    const name = target.name

    setValue(value)
    console.log('name:', name, 'value:', value)
  }

  return (
    <input
      name="username"
      value={value}
      onChange={handleChange}
    />
  )
}
```

### 箭头函数 vs 函数引用

```jsx
function Example() {
  const [count, setCount] = useState(0)

  // ✅ 箭头函数（需要传参数时）
  return <button onClick={() => setCount(count + 1)}>
    +1
  </button>

  // ✅ 函数引用（不需要参数时）
  const handleClick = () => {
    setCount(0)
  }
  return <button onClick={handleClick}>重置</button>

  // ❌ 错误：立即执行
  return <button onClick={setCount(0)}>重置</button>
  // 上面的写法会在渲染时就执行，而不是点击时
}
```

### 事件冒泡

```jsx
function BubblingExample() {
  function handleOuterClick() {
    console.log('外层点击')
  }

  function handleInnerClick(e) {
    e.stopPropagation()  // 阻止冒泡
    console.log('内层点击')
  }

  return (
    <div onClick={handleOuterClick} style={{ padding: '50px', background: 'red' }}>
      <div onClick={handleInnerClick} style={{ padding: '30px', background: 'blue' }}>
        点击我
      </div>
    </div>
  )
}
```

### 表单处理

```jsx
function FormExample() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    age: 0
  })

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value  // 动态属性名
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()  // 阻止表单默认提交
    console.log('提交:', formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="用户名"
      />
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="邮箱"
      />
      <input
        name="age"
        type="number"
        value={formData.age}
        onChange={handleChange}
        placeholder="年龄"
      />
      <button type="submit">提交</button>
    </form>
  )
}
```

---

## 条件渲染

### 三种方式

#### 1. 三元运算符

```jsx
function Welcome({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? <h1>欢迎回来！</h1> : <h1>请先登录</h1>}
    </div>
  )
}
```

#### 2. 逻辑与 (&&)

```jsx
function Notification({ message }) {
  return (
    <div>
      {/* 只有 message 存在时才显示 */}
      {message && <div className="alert">{message}</div>}
    </div>
  )
}

// 也可以写条件
{message && message.length > 0 && <div>{message}</div>}
```

#### 3. 提前返回

```jsx
function UserProfile({ user }) {
  if (!user) {
    return <p>加载中...</p>
  }

  if (user.error) {
    return <p>出错了: {user.error}</p>
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
}
```

### 多条件渲染

```jsx
function StatusBadge({ status }) {
  if (status === 'success') {
    return <span style={{ color: 'green' }}>成功</span>
  } else if (status === 'error') {
    return <span style={{ color: 'red' }}>失败</span>
  } else if (status === 'warning') {
    return <span style={{ color: 'orange' }}>警告</span>
  } else {
    return <span style={{ color: 'gray' }}>未知</span>
  }
}

// 或用对象映射
function StatusBadge({ status }) {
  const statusConfig = {
    success: { text: '成功', color: 'green' },
    error: { text: '失败', color: 'red' },
    warning: { text: '警告', color: 'orange' },
    default: { text: '未知', color: 'gray' }
  }

  const config = statusConfig[status] || statusConfig.default

  return <span style={{ color: config.color }}>{config.text}</span>
}
```

---

## 列表渲染

### 基本用法

```jsx
function ItemList() {
  const items = ['苹果', '香蕉', '橙子']

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}
```

### key 的重要性

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>  {/* ✅ 用唯一 ID */}
          {todo.text}
        </li>
      ))}
    </ul>
  )
}

// ❌ 不要用 index 作为 key（除非列表静态不变）
{items.map((item, index) => (
  <li key={index}>{item}</li>
))}

// ✅ 如果没有 ID，可以用内容的 hash
{items.map((item, index) => (
  <li key={item}>{item}</li>
))}
```

### 渲染对象数组

```jsx
function UserList() {
  const users = [
    { id: 1, name: '张三', age: 25 },
    { id: 2, name: '李四', age: 30 },
    { id: 3, name: '王五', age: 28 }
  ]

  return (
    <div>
      {users.map(user => (
        <div key={user.id} className="user-card">
          <h3>{user.name}</h3>
          <p>年龄: {user.age}</p>
        </div>
      ))}
    </div>
  )
}
```

### 带删除的列表

```jsx
function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: '学习 React', done: false },
    { id: 2, text: '写代码', done: true }
  ])

  function toggleTodo(id) {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ))
  }

  function deleteTodo(id) {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => deleteTodo(todo.id)}>删除</button>
        </li>
      ))}
    </ul>
  )
}
```

---

## 表单处理

### 受控组件

**受控** = 表单的值由 React state 控制

```jsx
function ControlledForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    console.log('提交:', { username, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="用户名"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="密码"
      />
      <button type="submit">登录</button>
    </form>
  )
}
```

### 非受控组件

**非受控** = 表单的值由 DOM 管理

```jsx
import { useRef } from 'react'

function UncontrolledForm() {
  const usernameRef = useRef()
  const passwordRef = useRef()

  function handleSubmit(e) {
    e.preventDefault()
    console.log('提交:', {
      username: usernameRef.current.value,
      password: passwordRef.current.value
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={usernameRef}
        type="text"
        placeholder="用户名"
      />
      <input
        ref={passwordRef}
        type="password"
        placeholder="密码"
      />
      <button type="submit">登录</button>
    </form>
  )
}
```

### 统一处理多个输入

```jsx
function MultiInputForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    age: ''
  })

  function handleChange(e) {
    const { name, value, type } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  return (
    <form>
      <input
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="用户名"
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="邮箱"
      />
      <input
        name="age"
        type="number"
        value={formData.age}
        onChange={handleChange}
        placeholder="年龄"
      />
    </form>
  )
}
```

### 下拉选择

```jsx
function SelectExample() {
  const [selectedValue, setSelectedValue] = useState('')

  return (
    <select
      value={selectedValue}
      onChange={e => setSelectedValue(e.target.value)}
    >
      <option value="">请选择</option>
      <option value="apple">苹果</option>
      <option value="banana">香蕉</option>
      <option value="orange">橙子</option>
    </select>
  )
}
```

### 复选框

```jsx
function CheckboxExample() {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <label>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={e => setIsChecked(e.target.checked)}
      />
      同意条款
    </label>
  )
}

// 多个复选框
function MultiCheckbox() {
  const [fruits, setFruits] = useState([])

  function handleChange(e) {
    const { value, checked } = e.target
    if (checked) {
      setFruits([...fruits, value])
    } else {
      setFruits(fruits.filter(f => f !== value))
    }
  }

  return (
    <div>
      {['苹果', '香蕉', '橙子'].map(fruit => (
        <label key={fruit}>
          <input
            type="checkbox"
            value={fruit}
            checked={fruits.includes(fruit)}
            onChange={handleChange}
          />
          {fruit}
        </label>
      ))}
    </div>
  )
}
```

### 单选按钮

```jsx
function RadioExample() {
  const [gender, setGender] = useState('')

  return (
    <div>
      <label>
        <input
          type="radio"
          name="gender"
          value="male"
          checked={gender === 'male'}
          onChange={e => setGender(e.target.value)}
        />
        男
      </label>
      <label>
        <input
          type="radio"
          name="gender"
          value="female"
          checked={gender === 'female'}
          onChange={e => setGender(e.target.value)}
        />
        女
      </label>
    </div>
  )
}
```

---

## useRef - 引用

### 什么是 Ref？

Ref = Reference（引用）
= 直接访问 DOM 元素或保存不触发渲染的值

### 用法1：访问 DOM 元素

```jsx
import { useRef } from 'react'

function FocusInput() {
  const inputRef = useRef(null)

  function handleClick() {
    // 直接操作 DOM，聚焦输入框
    inputRef.current.focus()
  }

  return (
    <div>
      <input ref={inputRef} placeholder="点击按钮聚焦" />
      <button onClick={handleClick}>聚焦</button>
    </div>
  )
}
```

### 用法2：保存不触发渲染的值

```jsx
function Timer() {
  const [count, setCount] = useState(0)
  const timerRef = useRef(null)  // 保存定时器 ID

  function start() {
    if (timerRef.current) return  // 防止重复启动

    timerRef.current = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)
  }

  function stop() {
    clearInterval(timerRef.current)
    timerRef.current = null
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <div>
      <p>{count}</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  )
}
```

### 用法3：获取上一次的值

```jsx
function PrevValueExample() {
  const [count, setCount] = useState(0)
  const prevCountRef = useRef(count)

  // 更新 ref，但不触发渲染
  useEffect(() => {
    prevCountRef.current = count
  }, [count])

  return (
    <div>
      <p>当前值: {count}</p>
      <p>上一次的值: {prevCountRef.current}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  )
}
```

### Ref vs State

| | Ref | State |
|---|-----|-------|
| 触发渲染 | ❌ 否 | ✅ 是 |
| 读取值 | `.current` | 直接用 |
| 更新值 | `.current = xxx` | `setState(xxx)` |
| 用途 | 访问 DOM、保存定时器 | 界面显示的数据 |

---

## useMemo - 记忆化

### 什么是 useMemo？

useMemo = 记忆计算结果
= 避免重复计算，提升性能

```jsx
import { useMemo, useState } from 'react'

function ExpensiveCalculation() {
  const [count, setCount] = useState(0)
  const [number, setNumber] = useState(1)

  // ❌ 每次渲染都重新计算
  const expensiveValue = fibonacci(number)

  // ✅ 只有 number 变化时才重新计算
  const expensiveValue = useMemo(() => {
    console.log('计算中...')  // 可以看到何时重新计算
    return fibonacci(number)
  }, [number])  // 依赖数组

  return (
    <div>
      <input
        type="number"
        value={number}
        onChange={e => setNumber(Number(e.target.value))}
      />
      <p>结果: {expensiveValue}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

// 斐波那契数列（计算密集）
function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}
```

### 什么时候用 useMemo？

✅ **应该用**：
- 计算很耗时
- 依赖值变化不频繁
- 需要传递给子组件的 props

❌ **不需要用**：
- 简单计算
- 每次渲染都需要最新值

### 示例：排序和过滤

```jsx
function ProductList({ products, filter, sortBy }) {
  // 记忆过滤和排序的结果
  const filteredProducts = useMemo(() => {
    console.log('过滤中...')
    return products
      .filter(p => p.name.includes(filter))
      .sort((a, b) => a[sortBy] - b[sortBy])
  }, [products, filter, sortBy])

  return (
    <ul>
      {filteredProducts.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}
```

---

## useCallback - 记忆化函数

### 什么是 useCallback？

useCallback = 记忆函数
= 避免子组件不必要的重新渲染

```jsx
import { useCallback, useState } from 'react'

function Parent() {
  const [count, setCount] = useState(0)

  // ❌ 每次渲染都创建新函数
  const handleClick = () => {
    console.log('点击')
  }

  // ✅ 函数引用不变
  const handleClick = useCallback(() => {
    console.log('点击')
  }, [])  // 空依赖，函数永远不会变

  // ✅ 依赖变化时才创建新函数
  const handleClick = useCallback(() => {
    console.log('点击', count)
  }, [count])  // count 变化时函数才变

  return <ChildButton onClick={handleClick} />
}

// 子组件用 React.memo 优化
const ChildButton = React.memo(function ChildButton({ onClick }) {
  console.log('ChildButton 渲染')
  return <button onClick={onClick}>点击</button>
})
```

### useCallback vs useMemo

```jsx
// useCallback 是 useMemo 的语法糖

// 等价写法1：useCallback
const handleClick = useCallback(() => {
  doSomething(a, b)
}, [a, b])

// 等价写法2：useMemo
const handleClick = useMemo(() => {
  return () => doSomething(a, b)
}, [a, b])
```

### 什么时候用 useCallback？

✅ **应该用**：
- 函数作为 props 传给 React.memo 包裹的子组件
- 函数作为依赖传给其他 Hook

❌ **不需要用**：
- 函数不传给子组件
- 不关心是否重新创建

---

## Context API - 跨组件传值

### 什么是 Context？

Context = 跨组件传递数据
= 避免一层层 props 传递

### 问题：Props Drilling

```jsx
// ❌ 不好的做法：一层层传递
function App() {
  const user = { name: '张三' }
  return <Header user={user} />
}

function Header({ user }) {
  return <Navigation user={user} />
}

function Navigation({ user }) {
  return <UserProfile user={user} />
}

function UserProfile({ user }) {
  return <h1>{user.name}</h1>  // 终于用到了
}
```

### 解决方案：Context

```jsx
// 1. 创建 Context
const UserContext = createContext()

// 2. 提供数据
function App() {
  const user = { name: '张三' }
  return (
    <UserContext.Provider value={user}>
      <Header />
    </UserContext.Provider>
  )
}

// 3. 消费数据
function UserProfile() {
  const user = useContext(UserContext)
  return <h1>{user.name}</h1>
}

// 中间组件不需要传递
function Header() {
  return <Navigation />
}

function Navigation() {
  return <UserProfile />
}
```

### 完整示例

```jsx
import { createContext, useContext, useState } from 'react'

// 1. 创建 Context
const ThemeContext = createContext()

// 2. Provider 组件
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 3. 自定义 Hook（可选）
function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内部使用')
  }
  return context
}

// 4. 使用
function App() {
  return (
    <ThemeProvider>
      <Toolbar />
      <Content />
    </ThemeProvider>
  )
}

function Toolbar() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div style={{ background: theme === 'light' ? '#fff' : '#333' }}>
      <button onClick={toggleTheme}>切换主题</button>
    </div>
  )
}

function Content() {
  const { theme } = useTheme()
  return (
    <div style={{ color: theme === 'light' ? '#000' : '#fff' }}>
      内容区域
    </div>
  )
}
```

### 多个 Context

```jsx
const UserContext = createContext()
const ThemeContext = createContext()

function App() {
  const [user, setUser] = useState({ name: '张三' })
  const [theme, setTheme] = useState('light')

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Header />
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}

function Header() {
  const user = useContext(UserContext)
  const { theme } = useContext(ThemeContext)
  // ...
}
```

---

## 自定义 Hooks

### 什么是自定义 Hook？

自定义 Hook = 复用状态逻辑的函数
= 把组件逻辑提取出来，供多个组件使用

### 规则

1. 名字必须以 `use` 开头
2. 可以调用其他 Hook
3. 不接收 JSX，只返回数据/函数

### 示例1：useCounter

```jsx
// 自定义 Hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)

  const increment = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  const decrement = useCallback(() => {
    setCount(c => c - 1)
  }, [])

  const reset = useCallback(() => {
    setCount(initialValue)
  }, [initialValue])

  return { count, increment, decrement, reset }
}

// 使用
function Counter() {
  const { count, increment, decrement, reset } = useCounter(0)

  return (
    <div>
      <p>{count}</p>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
      <button onClick={reset}>重置</button>
    </div>
  )
}
```

### 示例2：useFetch

```jsx
function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch(url)
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}

// 使用
function UserList() {
  const { data, loading, error } = useFetch('/api/users')

  if (loading) return <p>加载中...</p>
  if (error) return <p>错误: {error}</p>

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### 示例3：useLocalStorage

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    // 从 localStorage 读取初始值
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    // 保存到 localStorage
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('username', '')

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
      placeholder="输入名字，会自动保存"
    />
  )
}
```

### 示例4：useWindowSize

```jsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// 使用
function ResponsiveComponent() {
  const { width, height } = useWindowSize()

  return (
    <div>
      <p>窗口: {width} x {height}</p>
      {width < 768 ? <p>移动端</p> : <p>桌面端</p>}
    </div>
  )
}
```

---

## 性能优化技巧

### 1. React.memo - 记忆组件

```jsx
// 普通组件：每次父组件渲染都重新渲染
function ExpensiveChild({ data }) {
  console.log('渲染了')
  return <div>{data}</div>
}

// 优化后：只有 props 变化才渲染
const ExpensiveChild = React.memo(function ExpensiveChild({ data }) {
  console.log('渲染了')
  return <div>{data}</div>
})

// 使用
function Parent() {
  const [count, setCount] = useState(0)
  const data = { name: '张三' }

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveChild data={data} />  {/* 不会因为 count 变化而重新渲染 */}
    </div>
  )
}
```

### 2. 懒加载组件

```jsx
import { lazy, Suspense } from 'react'

// 懒加载
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <HeavyComponent />
    </Suspense>
  )
}
```

### 3. 虚拟化长列表

```jsx
// 使用 react-window 库
import { FixedSizeList } from 'react-window'

function LongList() {
  const items = Array.from({ length: 10000 }, (_, i) => `项目 ${i}`)

  const Row = ({ index, style }) => (
    <div style={style}>{items[index]}</div>
  )

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### 4. 避免内联函数

```jsx
// ❌ 每次渲染创建新函数，导致子组件重新渲染
function Parent() {
  return <Child onClick={() => console.log('click')} />
}

// ✅ 用 useCallback
function Parent() {
  const handleClick = useCallback(() => {
    console.log('click')
  }, [])
  return <Child onClick={handleClick} />
}
```

---

## 常见陷阱和最佳实践

### 陷阱1：直接修改 state

```jsx
// ❌ 错误
items.push(newItem)
setItems(items)

// ✅ 正确
setItems([...items, newItem])
```

### 陷阱2：依赖数组问题

```jsx
// ❌ 错误：漏掉依赖
useEffect(() => {
  fetchData(userId)
}, [])  // 应该包含 userId

// ✅ 正确
useEffect(() => {
  fetchData(userId)
}, [userId])
```

### 陷阱3：在循环/条件中使用 Hook

```jsx
// ❌ 错误
function BadComponent({ items }) {
  items.forEach(item => {
    useEffect(() => {
      console.log(item)
    }, [item])
  })
}

// ✅ 正确：Hook 必须在顶层调用
function GoodComponent({ items }) {
  useEffect(() => {
    items.forEach(item => {
      console.log(item)
    })
  }, [items])
}
```

### 最佳实践总结

| 规则 | 说明 |
|------|------|
| **Hook 规则** | 只在顶层调用，不在循环/条件中使用 |
| **Key 规则** | 列表渲染用稳定唯一的 key |
| **State 规则** | 永远不要直接修改 state |
| **Prop 规则** | Props 是只读的 |
| **命名规则** | 组件大写开头，Hook 以 use 开头 |
| **单一职责** | 一个组件只做一件事 |
| **提取逻辑** | 复用逻辑用自定义 Hook |
| **性能优化** | 需要时才用 memo/useMemo/useCallback |

---

## 学习路线建议

```
1. JSX 语法
   ↓
2. 组件与 Props
   ↓
3. useState 状态管理
   ↓
4. useEffect 副作用处理
   ↓
5. 事件处理和表单
   ↓
6. 条件渲染和列表渲染
   ↓
7. useRef、useMemo、useCallback
   ↓
8. Context API
   ↓
9. 自定义 Hooks
   ↓
10. 性能优化
   ↓
11. 实战项目
```

---

## 推荐练习

### 初级
- [ ] 计数器
- [ ] 待办事项列表
- [ ] 表单验证

### 中级
- [ ] 天气查询应用
- [ ] 购物车
- [ ] 博客列表

### 高级
- [ ] 复杂表单系统
- [ ] 实时聊天应用
- [ ] 数据可视化仪表盘

---

记住：**React 的核心思想就是 UI = f(state)，掌握好状态管理，就掌握了 React！**
