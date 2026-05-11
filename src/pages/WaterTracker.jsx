import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  getWaterRecords,
  getWaterHistory,
} from '../api'
import CacheManager from '../utils/cacheManager'
import ProgressBar from '../components/ProgressBar'
import './WaterTracker.css'

const GOAL = 2000

function WaterTracker() {
  const [records, setRecords] = useState([])
  const [history, setHistory] = useState([])
  const [customAmount, setCustomAmount] = useState('')
  const [status, setStatus] = useState('loading')
  const [statusMessage, setStatusMessage] = useState('正在加载数据...')
  const canvasRef = useRef(null)
  const cacheRef = useRef(null)
  const localIdCounter = useRef(0)
  const deletedIdsRef = useRef(new Set())

  // 从 localStorage 恢复已删除的记录 ID
  useEffect(() => {
    try {
      const deletedIds = localStorage.getItem('water_deleted_ids')
      if (deletedIds) {
        deletedIdsRef.current = new Set(JSON.parse(deletedIds))
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    const cache = new CacheManager('water')
    cache.init()
    cacheRef.current = cache

    // 尝试从缓存加载
    const cached = cache.getData()
    if (cached) {
      setRecords(cached.records || [])
      setHistory(cached.history || [])
      setStatus('connected')
      setStatusMessage('已连接到服务器')
    }

    // 后台刷新远程数据
    loadRemoteData(cache)

    return () => {
      cache.destroy()
    }
  }, [])

  useEffect(() => {
    if (canvasRef.current && history.length > 0) {
      drawChart(history, canvasRef.current)
    }
  }, [history, canvasRef.current])

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && history.length > 0) {
        drawChart(history, canvasRef.current)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [history])

  async function loadRemoteData(cache) {
    try {
      setStatus('loading')
      setStatusMessage('正在同步...')

      const [todayRecords, historyData] = await Promise.all([
        getWaterRecords(),
        getWaterHistory(),
      ])

      // 过滤掉本地已删除的记录
      const filteredRecords = todayRecords.filter(r => !deletedIdsRef.current.has(r.id))

      setRecords(filteredRecords)
      setHistory(historyData)

      // 更新缓存（使用过滤后的数据）
      const c = cache || cacheRef.current
      c.setData({ records: filteredRecords, history: historyData })

      setStatus('connected')
      setStatusMessage('已连接到服务器')
    } catch (error) {
      setStatus('error')
      setStatusMessage(`同步失败: ${error.message}`)
    }
  }

  function getTotalToday() {
    return records.reduce((sum, r) => sum + r.amount, 0)
  }

  function handleAddWater(amount) {
    // 即时更新本地状态
    const now = new Date()
    const localHour = now.getHours()
    const localMinute = now.getMinutes()
    const timeStr = `${String(localHour).padStart(2, '0')}:${String(localMinute).padStart(2, '0')}`

    localIdCounter.current -= 1
    const tempId = localIdCounter.current

    const newRecord = { id: tempId, amount, time: timeStr }
    const newRecords = [newRecord, ...records]
    setRecords(newRecords)

    // 更新缓存
    cacheRef.current.setData({ records: newRecords, history })

    // 操作入队列
    cacheRef.current.addOperation({ type: 'add', payload: { amount } })
  }

  function handleDeleteRecord(recordId) {
    // 即时更新本地状态
    const newRecords = records.filter(r => r.id !== recordId)
    setRecords(newRecords)

    // 更新缓存
    cacheRef.current.setData({ records: newRecords, history })

    // 保存删除的 ID 到 localStorage
    deletedIdsRef.current.add(recordId)
    try {
      localStorage.setItem('water_deleted_ids', JSON.stringify([...deletedIdsRef.current]))
    } catch (e) {
      // ignore
    }

    // 只有真实 id 才入队列（负数是本地临时 id）
    if (recordId > 0) {
      cacheRef.current.addOperation({ type: 'delete', payload: { id: recordId } })
    }
  }

  function handleAddCustom() {
    const amount = parseInt(customAmount)
    if (amount && amount > 0) {
      handleAddWater(amount)
      setCustomAmount('')
    } else {
      alert('请输入有效的正整数')
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleAddCustom()
    }
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

  return (
    <div className="water-tracker">
      <Link to="/" className="back-btn">
        <span>←</span>
        <span>返回主页</span>
      </Link>

      <h1>💧 喝水记录</h1>
      <div className="date-display">{getTodayString()}</div>

      <ProgressBar total={getTotalToday()} goal={GOAL} />

      <div className={`status-indicator ${status}`}>{statusMessage}</div>

      <div className="buttons">
        <button className="btn btn-100" onClick={() => handleAddWater(100)}>
          +100ml
        </button>
        <button className="btn btn-550" onClick={() => handleAddWater(550)}>
          +550ml
        </button>
      </div>

      <div className="input-section">
        <input
          type="number"
          placeholder="输入自定义毫升数"
          min="1"
          value={customAmount}
          onChange={e => setCustomAmount(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleAddCustom}>添加</button>
      </div>

      <div className="records-section">
        <div className="records-title">今日记录</div>
        <div className="records-list">
          {records.length === 0 ? (
            <div className="empty-records">暂无记录</div>
          ) : (
            records.map(record => (
              <div key={record.id} className="record-item">
                <span className="record-time">{record.time}</span>
                <div>
                  <span className="record-amount">+{record.amount}ml</span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteRecord(record.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">最近7天喝水量</div>
        <div className="chart-container">
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  )
}

// 绘制图表
function drawChart(data, canvas) {
  const ctx = canvas.getContext('2d')
  const container = canvas.parentElement
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight

  const padding = 40
  const width = canvas.width - padding * 2
  const height = canvas.height - padding * 2

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const maxAmount = Math.max(...data.map(d => d.total), GOAL)
  const yMax = Math.ceil(maxAmount / 500) * 500

  ctx.strokeStyle = '#e0e0e0'
  ctx.fillStyle = '#999'
  ctx.font = '11px Arial'
  ctx.textAlign = 'right'

  for (let i = 0; i <= 4; i++) {
    const y = padding + height - (i / 4) * height
    const value = Math.round((i / 4) * yMax)

    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(canvas.width - padding, y)
    ctx.stroke()

    ctx.fillText(value, padding - 5, y + 4)
  }

  ctx.textAlign = 'center'
  const xStep = width / (data.length - 1 || 1)
  data.forEach((d, i) => {
    const x = padding + i * xStep
    ctx.fillText(d.date, x, canvas.height - padding + 20)
  })

  const points = data.map((d, i) => ({
    x: padding + i * xStep,
    y: padding + height - (d.total / yMax) * height,
    value: d.total,
  }))

  if (points.length > 1) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }

    ctx.strokeStyle = '#667eea'
    ctx.lineWidth = 2
    ctx.stroke()

    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding)
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)')
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0)')

    ctx.lineTo(points[points.length - 1].x, canvas.height - padding)
    ctx.lineTo(points[0].x, canvas.height - padding)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }

  points.forEach(point => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#667eea'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#333'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(point.value, point.x, point.y - 10)
  })
}

export default WaterTracker
