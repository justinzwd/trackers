/**
 * CacheManager - 本地优先缓存管理器
 *
 * 工作流：
 * 1. 页面加载 → 从 localStorage 读取缓存数据（即时显示）→ 后台从远程刷新
 * 2. 用户操作 → 更新 localStorage + UI 状态 → 操作入队列
 * 3. 退出页面 → 批量发送队列中的操作到远程 DB
 */

const FLUSH_INTERVAL = 30000 // 30 秒自动 flush
const CACHE_PREFIX = 'tracker_cache_'
const QUEUE_PREFIX = 'tracker_queue_'

class CacheManager {
  constructor(toolName) {
    this.toolName = toolName
    this.cacheKey = CACHE_PREFIX + toolName
    this.queueKey = QUEUE_PREFIX + toolName
    this.flushTimer = null
    this.flushing = false
    this._boundBeforeUnload = this._handleBeforeUnload.bind(this)
    this._boundVisibilityChange = this._handleVisibilityChange.bind(this)
    this._boundPageHide = this._handlePageHide.bind(this)
  }

  // ========== 生命周期 ==========

  /** 初始化：注册自动同步事件 */
  init() {
    window.addEventListener('beforeunload', this._boundBeforeUnload)
    window.addEventListener('pagehide', this._boundPageHide)
    document.addEventListener('visibilitychange', this._boundVisibilityChange)
    this._startAutoFlush()
  }

  /** 销毁：同步并清理事件 */
  destroy() {
    this.flushSync()
    window.removeEventListener('beforeunload', this._boundBeforeUnload)
    window.removeEventListener('pagehide', this._boundPageHide)
    document.removeEventListener('visibilitychange', this._boundVisibilityChange)
    this._stopAutoFlush()
  }

  // ========== 缓存读写 ==========

  /** 获取缓存的数据 */
  getData() {
    try {
      const raw = localStorage.getItem(this.cacheKey)
      if (raw) {
        return JSON.parse(raw)
      }
    } catch (e) {
      // ignore
    }
    return null
  }

  /** 存储数据到缓存 */
  setData(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(data))
    } catch (e) {
      // localStorage 满了，忽略
    }
  }

  // ========== 操作队列 ==========

  /** 获取待同步队列 */
  getQueue() {
    try {
      const raw = localStorage.getItem(this.queueKey)
      if (raw) {
        return JSON.parse(raw)
      }
    } catch (e) {
      // ignore
    }
    return []
  }

  /** 添加操作到队列 */
  addOperation(op) {
    const queue = this.getQueue()
    queue.push({ ...op, timestamp: Date.now() })
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(queue))
    } catch (e) {
      // ignore
    }
  }

  /** 清空队列 */
  clearQueue() {
    localStorage.removeItem(this.queueKey)
  }

  /** 是否有待同步的操作 */
  hasPending() {
    return this.getQueue().length > 0
  }

  // ========== 同步逻辑 ==========

  /** 异步 flush 队列到远程 */
  async flush() {
    const queue = this.getQueue()
    if (queue.length === 0 || this.flushing) return

    this.flushing = true
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: this.toolName,
          operations: queue,
        }),
      })

      if (response.ok) {
        this.clearQueue()
      }
    } catch (e) {
      // 网络失败，保留队列等下次重试
      console.warn('Cache flush failed:', e)
    } finally {
      this.flushing = false
    }
  }

  /** 同步 flush（用于 beforeunload，使用 sendBeacon） */
  flushSync() {
    const queue = this.getQueue()
    if (queue.length === 0) return

    const data = JSON.stringify({
      tool: this.toolName,
      operations: queue,
    })

    const sent = navigator.sendBeacon('/api/sync', new Blob([data], { type: 'application/json' }))
    if (sent) {
      this.clearQueue()
    }
  }

  // ========== 内部方法 ==========

  _handleBeforeUnload() {
    this.flushSync()
  }

  _handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this.flushSync()
    }
  }

  _handlePageHide() {
    this.flushSync()
  }

  _startAutoFlush() {
    this._stopAutoFlush()
    this.flushTimer = setInterval(() => {
      if (this.hasPending()) {
        this.flush()
      }
    }, FLUSH_INTERVAL)
  }

  _stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }
}

export default CacheManager
