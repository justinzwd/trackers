import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getBonusData,
  addBonusItem,
  incrementBonusCount,
  deleteBonusItem,
  deleteBonusHistory,
  clearBonusHistory,
  reorderBonusItems,
} from '../api'
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

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setStatus('loading')
      setStatusMessage('正在加载数据...')
      const data = await getBonusData()
      setItems(data.items || [])
      setHistory(data.history || [])
      setTotal(data.total || 0)
      setStatus('connected')
      setStatusMessage('已连接到服务器')
    } catch (error) {
      setStatus('error')
      setStatusMessage(`加载失败: ${error.message}`)
    }
  }

  async function handleIncrement(itemId) {
    try {
      setStatus('loading')
      setStatusMessage('正在添加...')
      await incrementBonusCount(itemId)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`操作失败: ${error.message}`)
    }
  }

  async function handleDeleteItem(itemId) {
    if (!confirm('确定要删除这个项目吗？')) return
    try {
      setStatus('loading')
      setStatusMessage('正在删除...')
      await deleteBonusItem(itemId)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`删除失败: ${error.message}`)
    }
  }

  async function handleDeleteHistory(recordId) {
    try {
      setStatus('loading')
      setStatusMessage('正在删除...')
      await deleteBonusHistory(recordId)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`删除失败: ${error.message}`)
    }
  }

  async function handleClearHistory() {
    if (!confirm('确定要清空所有历史记录吗？这将重置所有项目的次数为0。')) return
    try {
      setStatus('loading')
      setStatusMessage('正在清空...')
      await clearBonusHistory()
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`清空失败: ${error.message}`)
    }
  }

  async function handleAddItem() {
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

    try {
      setStatus('loading')
      setStatusMessage('正在添加...')
      await addBonusItem(name, value)
      await loadData()
      setItemName('')
      setItemValue('')
    } catch (error) {
      setStatus('error')
      setStatusMessage(`添加失败: ${error.message}`)
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleAddItem()
    }
  }

  async function handleDragStart(index) {
    setDraggedIndex(index)
  }

  async function handleDragOver(e, index) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newItems = [...items]
    const [movedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, movedItem)

    setItems(newItems)
    setDraggedIndex(index)
  }

  async function handleDrop() {
    if (draggedIndex === null) return

    try {
      setStatus('loading')
      setStatusMessage('正在保存排序...')
      await reorderBonusItems(items.map((item, i) => ({ id: item.id, sort_order: i })))
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`排序失败: ${error.message}`)
    }
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

      {/* 状态指示 */}
      <div className={`status-indicator ${status}`}>{statusMessage}</div>

      {/* 总积分显示 */}
      <div className="total-display">
        <div className="total-label">总积分</div>
        <div className="total-value">{total}</div>
      </div>

      {/* 表头 */}
      <div className="table-header">
        <span></span>
        <span>项目名称</span>
        <span>单次奖励</span>
        <span>次数</span>
        <span>总和</span>
        <span></span>
      </div>

      {/* 项目列表 */}
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

      {/* 添加新项目表单 */}
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

      {/* 历史记录 */}
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
