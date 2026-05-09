import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  getWaterRecords,
  addWaterRecord,
  deleteWaterRecord,
  getWaterHistory,
} from '../api'
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

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  // 绘制图表
  useEffect(() => {
    if (canvasRef.current && history.length > 0) {
      drawChart(history, canvasRef.current)
    }
  }, [history, canvasRef.current])

  // 窗口大小变化时重绘图表
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && history.length > 0) {
        drawChart(history, canvasRef.current)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [history])

  async function loadData() {
    try {
      setStatus('loading')
      setStatusMessage('正在加载数据...')

      const [todayRecords, historyData] = await Promise.all([
        getWaterRecords(),
        getWaterHistory(),
      ])

      setRecords(todayRecords)
      setHistory(historyData)

      setStatus('connected')
      setStatusMessage('已连接到服务器')
    } catch (error) {
      setStatus('error')
      setStatusMessage(`加载失败: ${error.message}`)
    }
  }

  function getTotalToday() {
    return records.reduce((sum, r) => sum + r.amount, 0)
  }

  async function handleAddWater(amount) {
    try {
      await addWaterRecord(amount)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`添加失败: ${error.message}`)
    }
  }

  async function handleDeleteRecord(recordId) {
    try {
      await deleteWaterRecord(recordId)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`删除失败: ${error.message}`)
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
    return today.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  return (
    <div className="water-tracker">
      <Link to="/" className="back-btn">
        <span>←</span>
        <span>返回主页</span>
      </Link>

      <h1>💧 喝水记录</h1>
      <div className="date-display">{getTodayString()}</div>

      {/* 圆环进度 */}
      <ProgressBar total={getTotalToday()} goal={GOAL} />

      {/* 状态指示 */}
      <div className={`status-indicator ${status}`}>{statusMessage}</div>

      {/* 快捷按钮 */}
      <div className="buttons">
        <button className="btn btn-100" onClick={() => handleAddWater(100)}>
          +100ml
        </button>
        <button className="btn btn-550" onClick={() => handleAddWater(550)}>
          +550ml
        </button>
      </div>

      {/* 自定义输入 */}
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

      {/* 今日记录 */}
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

      {/* 图表 */}
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

  // 绘制网格线和 Y 轴标签
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

  // 绘制 X 轴标签
  ctx.textAlign = 'center'
  const xStep = width / (data.length - 1 || 1)
  data.forEach((d, i) => {
    const x = padding + i * xStep
    ctx.fillText(d.date, x, canvas.height - padding + 20)
  })

  // 绘制数据点和连线
  const points = data.map((d, i) => ({
    x: padding + i * xStep,
    y: padding + height - (d.total / yMax) * height,
    value: d.total,
  }))

  if (points.length > 1) {
    // 绘制连线
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }

    ctx.strokeStyle = '#667eea'
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制渐变填充
    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding)
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)')
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0)')

    ctx.lineTo(points[points.length - 1].x, canvas.height - padding)
    ctx.lineTo(points[0].x, canvas.height - padding)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }

  // 绘制数据点
  points.forEach(point => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#667eea'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 数值标签
    ctx.fillStyle = '#333'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(point.value, point.x, point.y - 10)
  })
}

export default WaterTracker
