import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getBonusData } from '../api'
import CacheManager from '../utils/cacheManager'
import './BonusTracker.css'

function BonusTracker() {
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('loading')
  const [statusMessage, setStatusMessage] = useState('正在加载数据...')
  const [itemName, setItemName] = useState('')
  const [itemValue, setItemValue] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const cacheRef = useRef(null)
  const localIdCounter = useRef(0)

  useEffect(() => {
    const cache = new CacheManager('bonus')
    cache.init()
    cacheRef.current = cache

    const cached = cache.getData()
    if (cached) {
      setItems(cached.items || [])
      setHistory(cached.history || [])
      setTotal(cached.total || 0)
      setStatus('connected')
      setStatusMessage('已连接到服务器')
    }

    loadRemoteData(cache)

    return () => {
      cache.destroy()
    }
  }, [])

  async function loadRemoteData(cache) {
    try {
      setStatus('loading')
      setStatusMessage('正在同步...')
      const data = await getBonusData()

      setItems(data.items || [])
      setHistory(data.history || [])
      setTotal(data.total || 0)

      const c = cache || cacheRef.current
      c.setData({ items: data.items || [], history: data.history || [], total: data.total || 0 })

      setStatus('connected')
      setStatusMessage('已连接到服务器')
    } catch (error) {
      setStatus('error')
      setStatusMessage(`同步失败: ${error.message}`)
    }
  }

  function handleIncrement(itemId) {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    // 更新 items 中的 count
    const newItems = items.map(i =>
      i.id === itemId ? { ...i, count: (i.count || 0) + 1 } : i
    )

    // 添加历史记录
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    localIdCounter.current -= 1
    const newHistoryItem = {
      id: localIdCounter.current,
      itemId: item.id,
      itemName: item.name,
      amount: item.value,
      date: todayStr,
      time: timeStr,
    }

    const newHistory = [newHistoryItem, ...history]
    const newTotal = total + item.value

    setItems(newItems)
    setHistory(newHistory)
    setTotal(newTotal)

    cacheRef.current.setData({ items: newItems, history: newHistory, total: newTotal })
    cacheRef.current.addOperation({
      type: 'increment',
      payload: { itemId: item.id, itemName: item.name, itemValue: item.value },
    })
  }

  function handleDeleteItem(itemId) {
    if (!confirm('确定要删除这个项目吗？')) return

    const newItems = items.filter(i => i.id !== itemId)
    const newHistory = history.filter(h => h.itemId !== itemId)
    const removedTotal = history.filter(h => h.itemId === itemId).reduce((sum, h) => sum + h.amount, 0)
    const newTotal = total - removedTotal

    setItems(newItems)
    setHistory(newHistory)
    setTotal(newTotal)

    cacheRef.current.setData({ items: newItems, history: newHistory, total: newTotal })

    if (itemId > 0) {
      cacheRef.current.addOperation({ type: 'deleteItem', payload: { id: itemId } })
    }
  }

  function handleDeleteHistory(recordId) {
    const record = history.find(h => h.id === recordId)
    if (!record) return

    const newHistory = history.filter(h => h.id !== recordId)
    const newTotal = total - record.amount

    // 更新对应 item 的 count
    const newItems = items.map(i =>
      i.id === record.itemId ? { ...i, count: Math.max(0, (i.count || 0) - 1) } : i
    )

    setHistory(newHistory)
    setTotal(newTotal)
    setItems(newItems)

    cacheRef.current.setData({ items: newItems, history: newHistory, total: newTotal })

    if (recordId > 0) {
      cacheRef.current.addOperation({ type: 'deleteHistory', payload: { id: recordId } })
    }
  }

  function handleClearHistory() {
    if (!confirm('确定要清空所有历史记录吗？这将重置所有项目的次数为0。')) return

    const newItems = items.map(i => ({ ...i, count: 0 }))

    setHistory([])
    setTotal(0)
    setItems(newItems)

    cacheRef.current.setData({ items: newItems, history: [], total: 0 })
    cacheRef.current.addOperation({ type: 'clearHistory', payload: {} })
  }

  function handleAddItem() {
    const name = itemName.trim()
    const value = parseInt(itemValue)

    if (!name) {
      alert('请输入项目名称')
      return
    }
    if (!value || value <= 0) {
      alert('请输入有效的单次奖励')
      return
    }

    localIdCounter.current -= 1
    const newItem = {
      id: localIdCounter.current,
      name,
      value,
      count: 0,
      sort_order: items.length,
    }

    const newItems = [...items, newItem]
    setItems(newItems)

    cacheRef.current.setData({ items: newItems, history, total })
    cacheRef.current.addOperation({ type: 'addItem', payload: { name, value, sort_order: items.length } })

    setItemName('')
    setItemValue('')
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleAddItem()
    }
  }

  function handleDragStart(index) {
    setDraggedIndex(index)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newItems = [...items]
    const [movedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, movedItem)

    setItems(newItems)
    setDraggedIndex(index)
  }

  function handleDrop() {
    if (draggedIndex === null) return

    cacheRef.current.setData({ items, history, total })
    cacheRef.current.addOperation({
      type: 'reorder',
      payload: { items: items.map((item, i) => ({ id: item.id, sort_order: i })) },
    })

    setDraggedIndex(null)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  function calculateItemTotal(item) {
    return item.value * (item.count || 0)
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (dateStr === todayStr) return '今天'
    if (dateStr === yesterdayStr) return '昨天'

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })
  }

  function getTodayString() {
    const today = new Date()
    const dateStr = today.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' })
    return `${dateStr} ${weekday}`
  }

  // 按日期分组历史记录
  const groupedHistory = {}
  history.forEach(h => {
    if (!groupedHistory[h.date]) {
      groupedHistory[h.date] = []
    }
    groupedHistory[h.date].push(h)
  })

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a))

  const isLoading = status === 'loading'

  return (
    <div className="bonus-tracker">
      <Link to="/" className="back-btn">
        <span>←</span>
        <span>返回主页</span>
      </Link>

      <h1>🎁 Bonus 积分系统</h1>
      <div className="date-display">{getTodayString()}</div>

      <div className={`status-indicator ${status}`}>{statusMessage}</div>

      <div className="total-display">
        <div className="total-label">总积分</div>
        <div className="total-value">{total}</div>
      </div>

      <div className="table-header">
        <span></span>
        <span>项目名称</span>
        <span>单次奖励</span>
        <span>次数</span>
        <span>总和</span>
        <span></span>
      </div>

      <div className="items-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div>暂无项目，请添加新项目</div>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`item-row ${draggedIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            >
              <div className="drag-handle">⋮⋮</div>
              <div className="item-name">{item.name}</div>
              <div className="item-value">{item.value}</div>
              <div className="item-value">{item.count || 0}</div>
              <div className="item-value total">{calculateItemTotal(item)}</div>
              <div className="item-actions">
                <button
                  className="add-btn"
                  onClick={() => handleIncrement(item.id)}
                  disabled={isLoading}
                >
                  +1
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={isLoading}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="add-form">
        <input
          type="text"
          placeholder="项目名称"
          value={itemName}
          onChange={e => setItemName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && document.getElementById('itemValue')?.focus()}
          disabled={isLoading}
        />
        <input
          id="itemValue"
          type="number"
          placeholder="单次奖励"
          min="1"
          value={itemValue}
          onChange={e => setItemValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button className="add-project-btn" onClick={handleAddItem} disabled={isLoading}>
          添加项目
        </button>
      </div>

      <div className="history-section">
        <div className="history-header">
          <h2>📜 历史记录</h2>
          <button
            className="clear-history-btn"
            onClick={handleClearHistory}
            disabled={isLoading || history.length === 0}
          >
            清空历史
          </button>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">暂无历史记录</div>
          ) : (
            sortedDates.map(date => (
              <div key={date} className="history-group">
                <div className="history-date">{formatDate(date)}</div>
                {groupedHistory[date].map(h => (
                  <div key={h.id} className="history-item">
                    <div className="history-info">
                      <span className="history-item-name">{h.itemName}</span>
                      <span className="history-item-amount">+{h.amount}</span>
                      <span className="history-item-time">{h.time}</span>
                    </div>
                    <button
                      className="history-delete"
                      onClick={() => handleDeleteHistory(h.id)}
                      disabled={isLoading}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default BonusTracker
