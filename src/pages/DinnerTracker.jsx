import { useEffect, useState, useRef } from 'react'
  import { Link } from 'react-router-dom'
  import { getAllDinnerRecords } from '../api'
  import CacheManager from '../utils/cacheManager'
  import './DinnerTracker.css'

  const DAILY_BUDGET = 20

  function DinnerTracker() {
    const [records, setRecords] = useState([])
    const [status, setStatus] = useState('loading')
    const [statusMessage, setStatusMessage] = useState('正在加载数据...')
    const [spentInput, setSpentInput] = useState('')
    const cacheRef = useRef(null)
    const localIdCounter = useRef(0)

    useEffect(() => {
      const cache = new CacheManager('dinner')
      cache.init()
      cacheRef.current = cache

      const cached = cache.getData()
      if (cached) {
        setRecords(cached.records || [])
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
        const allRecords = await getAllDinnerRecords()
        setRecords(allRecords)

        const c = cache || cacheRef.current
        c.setData({ records: allRecords })

        setStatus('connected')
        setStatusMessage('已连接到服务器')
      } catch (error) {
        setStatus('error')
        setStatusMessage(`同步失败: ${error.message}`)
      }
    }

    function getTotalSaved() {
      return records.reduce((sum, r) => sum + r.saved, 0)
    }

    function handleAddDinner() {
      const spent = parseFloat(spentInput)
      if (isNaN(spent) || spent < 0) {
        alert('请输入有效的花销金额')
        return
      }

      const saved = DAILY_BUDGET - spent
      const today = new Date().toISOString().split('T')[0]

      localIdCounter.current -= 1
      const tempId = localIdCounter.current

      const newRecord = { id: tempId, spent, saved, date: today }
      const newRecords = [newRecord, ...records]
      setRecords(newRecords)

      cacheRef.current.setData({ records: newRecords })
      cacheRef.current.addOperation({ type: 'add', payload: { spent, saved } })

      setSpentInput('')
    }

    function handleDeleteRecord(recordId) {
      const newRecords = records.filter(r => r.id !== recordId)
      setRecords(newRecords)

      cacheRef.current.setData({ records: newRecords })

      if (recordId > 0) {
        cacheRef.current.addOperation({ type: 'delete', payload: { id: recordId } })
      }
    }

    function handleKeyPress(e) {
      if (e.key === 'Enter') {
        handleAddDinner()
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
      <div className="dinner-tracker">
        <Link to="/" className="back-btn">
          <span>←</span>
          <span>返回主页</span>
        </Link>

        <h1>🍽️  晚饭攒钱</h1>
        <div className="date-display">{getTodayString()}</div>

        <div className={`status-indicator ${status}`}>{statusMessage}</div>

        <div className="stats-container">
            <div className="stat-box saved-box">
              <div className="stat-label">已攒钱</div>
              <div className="stat-value">{getTotalSaved().toFixed(2)}</div>
            </div>
        </div>

        <div className="budget-info">
          📅 每天晚饭预算：<span className="budget-amount">{DAILY_BUDGET}元</span>
        </div>

        <div className="add-form">
          <div className="form-group">
            <label>日期</label>
            <input
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="form-group">
            <label>实际花销（元）</label>
            <input
              type="number"
              placeholder="输入花销"
              min="0"
              step="0.01"
              value={spentInput}
              onChange={e => setSpentInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <button className="add-btn" onClick={handleAddDinner}>
            确定
          </button>
        </div>

        <div className="records-section">
            <div className="records-title">历史记录</div>
          <div className="records-list">
            {records.length === 0 ? (
              <div className="empty-records">
                <div className="empty-icon">💰</div>
                <div>暂无记录，请添加新的记录</div>
              </div>
            ) : (
                records.map(record => (
                    <div key={record.id} className="record-item">
                      <div className="record-info">
                          <span className="record-date">{record.date}</span>
                          <span className="record-spent">-{record.spent.toFixed(2)}</span>
                          <span className={`record-saved ${record.saved < 0 ? 'negative' : ''}`}>
                            {record.saved >= 0 ? '+' : ''}{record.saved.toFixed(2)}
                          </span>
                        </div>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRecord(record.id)}
                      >
                        删除
                      </button>
                    </div>
                  ))
            )}
          </div>
        </div>
      </div>
    )
  }

  export default DinnerTracker
