import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getOkrGoals, getOkrRecords } from '../api'
import CacheManager from '../utils/cacheManager'
import './OkrTracker.css'

function OkrTracker() {
  const [goals, setGoals] = useState([])
  const [status, setStatus] = useState('loading')
  const [statusMessage, setStatusMessage] = useState('正在加载数据...')
  const [goalName, setGoalName] = useState('')
  const [goalCount, setGoalCount] = useState('')
  const [expandedGoalId, setExpandedGoalId] = useState(null)
  const [records, setRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const cacheRef = useRef(null)
  const localIdCounter = useRef(0)

  useEffect(() => {
    const cache = new CacheManager('okr')
    cache.init()
    cacheRef.current = cache

    const cached = cache.getData()
    if (cached) {
      setGoals(cached.goals || [])
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
      const data = await getOkrGoals()
      setGoals(data.goals || [])

      const c = cache || cacheRef.current
      c.setData({ goals: data.goals || [] })

      setStatus('connected')
      setStatusMessage('已连接到服务器')
    } catch (error) {
      setStatus('error')
      setStatusMessage(`同步失败: ${error.message}`)
    }
  }

  async function loadRecords(goalId) {
    try {
      setRecordsLoading(true)
      const data = await getOkrRecords(goalId)
      setRecords(data)
    } catch (error) {
      setRecords([])
    } finally {
      setRecordsLoading(false)
    }
  }

  function handleAddGoal() {
    const name = goalName.trim()
    const count = parseInt(goalCount)

    if (!name) {
      alert('请输入目标名称')
      return
    }
    if (!count || count <= 0) {
      alert('请输入有效的目标次数')
      return
    }

    localIdCounter.current -= 1
    const newGoal = {
      id: localIdCounter.current,
      name,
      targetCount: count,
      completedCount: 0,
      completed: false,
      completedDate: null,
      sortOrder: 0,
    }

    const newGoals = [newGoal, ...goals]
    setGoals(newGoals)

    cacheRef.current.setData({ goals: newGoals })
    cacheRef.current.addOperation({ type: 'addGoal', payload: { name, targetCount: count } })

    setGoalName('')
    setGoalCount('')
  }

  function handleIncrement(goalId) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal || goal.completed) return

    const newCount = goal.completedCount + 1
    const isCompleted = newCount >= goal.targetCount
    const completedDate = isCompleted ? new Date().toISOString().split('T')[0] : null

    const newGoals = goals.map(g =>
      g.id === goalId
        ? { ...g, completedCount: newCount, completed: isCompleted, completedDate }
        : g
    )

    setGoals(newGoals)
    cacheRef.current.setData({ goals: newGoals })
    cacheRef.current.addOperation({ type: 'increment', payload: { goalId } })

    // 如果展开了该目标的记录，添加本地临时记录
    if (expandedGoalId === goalId) {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      localIdCounter.current -= 1
      const newRecord = { id: localIdCounter.current, goalId, date: todayStr, time: timeStr }
      setRecords([newRecord, ...records])
    }
  }

  function handleDeleteGoal(goalId) {
    if (!confirm('确定要删除这个目标吗？')) return

    const newGoals = goals.filter(g => g.id !== goalId)
    setGoals(newGoals)

    if (expandedGoalId === goalId) {
      setExpandedGoalId(null)
      setRecords([])
    }

    cacheRef.current.setData({ goals: newGoals })

    if (goalId > 0) {
      cacheRef.current.addOperation({ type: 'deleteGoal', payload: { goalId } })
    }
  }

  function handleDeleteRecord(recordId, goalId) {
    // 更新本地记录
    const newRecords = records.filter(r => r.id !== recordId)
    setRecords(newRecords)

    // 扣减目标计数
    const goal = goals.find(g => g.id === goalId)
    if (goal) {
      const newCount = Math.max(0, goal.completedCount - 1)
      const newGoals = goals.map(g =>
        g.id === goalId
          ? { ...g, completedCount: newCount, completed: false, completedDate: null }
          : g
      )
      setGoals(newGoals)
      cacheRef.current.setData({ goals: newGoals })
    }

    if (recordId > 0) {
      cacheRef.current.addOperation({ type: 'deleteRecord', payload: { recordId, goalId } })
    }
  }

  function handleToggleRecords(goalId) {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null)
      setRecords([])
    } else {
      setExpandedGoalId(goalId)
      loadRecords(goalId)
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleAddGoal()
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

  const isLoading = status === 'loading'

  return (
    <div className="okr-tracker">
      <Link to="/" className="back-btn">
        <span>←</span>
        <span>返回主页</span>
      </Link>

      <h1>🎯 目标OKR</h1>
      <div className="date-display">{getTodayString()}</div>

      <div className={`status-indicator ${status}`}>{statusMessage}</div>

      <div className="goals-list">
        {goals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div>暂无目标，请添加新目标</div>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className={`goal-card ${goal.completed ? 'completed' : ''}`}>
              <div className="goal-main">
                <div className="goal-ring" onClick={() => handleToggleRecords(goal.id)}>
                  <svg width="52" height="52" viewBox="0 0 52 52">
                    <circle
                      cx="26"
                      cy="26"
                      r="22"
                      fill="transparent"
                      stroke="#e0e0e0"
                      strokeWidth="4"
                    />
                    <circle
                      cx="26"
                      cy="26"
                      r="22"
                      fill="transparent"
                      stroke={goal.completed ? '#52c41a' : '#667eea'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${22 * 2 * Math.PI}`}
                      strokeDashoffset={`${22 * 2 * Math.PI * (1 - Math.min(goal.completedCount / goal.targetCount, 1))}`}
                      transform="rotate(-90 26 26)"
                    />
                  </svg>
                  <div className="goal-ring-text">
                    {Math.round((goal.completedCount / goal.targetCount) * 100)}%
                  </div>
                </div>
                <div className="goal-info" onClick={() => handleToggleRecords(goal.id)}>
                  <div className="goal-name">
                    {goal.completed && <span className="completed-badge">已完成</span>}
                    {goal.name}
                  </div>
                  <div className="goal-progress">
                    {goal.completedCount} / {goal.targetCount}
                  </div>
                </div>
                <div className="goal-actions">
                  {!goal.completed && (
                    <button
                      className="increment-btn"
                      onClick={() => handleIncrement(goal.id)}
                      disabled={isLoading}
                    >
                      +1
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteGoal(goal.id)}
                    disabled={isLoading}
                  >
                    删除
                  </button>
                </div>
              </div>

              {expandedGoalId === goal.id && (
                <div className="goal-records">
                  <div className="records-title">打卡记录</div>
                  {recordsLoading ? (
                    <div className="records-loading">加载中...</div>
                  ) : records.length === 0 ? (
                    <div className="records-empty">暂无打卡记录</div>
                  ) : (
                    <div className="records-list">
                      {records.map(record => (
                        <div key={record.id} className="record-item">
                          <span className="record-date">{formatDate(record.date)}</span>
                          <span className="record-time">{record.time}</span>
                          <button
                            className="record-delete"
                            onClick={() => handleDeleteRecord(record.id, goal.id)}
                            disabled={isLoading}
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="add-form">
        <input
          type="text"
          placeholder="目标名称（如：读完《原则》）"
          value={goalName}
          onChange={e => setGoalName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && document.getElementById('goalCount')?.focus()}
          disabled={isLoading}
        />
        <input
          id="goalCount"
          type="number"
          placeholder="完成次数"
          min="1"
          value={goalCount}
          onChange={e => setGoalCount(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button className="add-goal-btn" onClick={handleAddGoal} disabled={isLoading}>
          确定
        </button>
      </div>
    </div>
  )
}

export default OkrTracker
