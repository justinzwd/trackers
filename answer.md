# 前端代码里 const、let、var 的区别

## 三种声明方式对比

| 关键字 | 能否重新赋值 | 作用域 | 提升行为 |
|--------|-------------|--------|---------|
| `const` | 不能 | 块级 | 有提升但不可访问（暂时性死区） |
| `let` | 能 | 块级 | 同上 |
| `var` | 能 | 函数级 | 提升且初始化为 `undefined` |

## const vs let

```js
const name = '张三'
name = '李四'  // ❌ 报错，不能重新赋值

let age = 25
age = 26       // ✅ 可以重新赋值
```

注意：`const` 只是不能重新赋值引用，对象/数组的内容仍然可以修改：

```js
const list = [1, 2, 3]
list.push(4)        // ✅ 可以，修改内容不是重新赋值
list = [5, 6, 7]   // ❌ 报错，不能指向新数组
```

## 为什么很少看到 let？

因为在 React 项目中，大多数变量声明后就不需要重新赋值：

```jsx
const [count, setCount] = useState(0)   // 解构赋值，不会变
const handleClick = () => { ... }        // 函数引用，不会变
const total = items.reduce(...)          // 计算结果，算完就用
const router = useNavigate()             // hook 返回值，不会变
```

需要用 `let` 的场景通常是循环或条件累加：

```js
let sum = 0
for (const item of items) {
  sum += item.value
}
```

社区的最佳实践是：**默认用 `const`，只有确实需要重新赋值时才用 `let`**。这样代码意图更清晰——看到 `const` 就知道这个值后面不会变。

## var 为什么基本不用了？

`var` 是 ES5 时代的写法，有两个问题：

```js
// 问题1：没有块级作用域
if (true) {
  var x = 1
}
console.log(x)  // 1（泄漏到外面了）

if (true) {
  let y = 1
}
console.log(y)  // ❌ ReferenceError（被限制在块内）

// 问题2：变量提升导致意外行为
console.log(a)  // undefined（不报错，很迷惑）
var a = 1

console.log(b)  // ❌ ReferenceError（及时报错，更安全）
let b = 1
```

所以现代项目中基本只用 `const` 和 `let`，`var` 已经被淘汰了。
