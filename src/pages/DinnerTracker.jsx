import { useEffect, useState } from 'react'
  import { Link } from 'react-router-dom'
  import {
    getAllDinnerRecords,
    addDinnerRecord,
    deleteDinnerRecord,
  } from '../api'
  import './DinnerTracker.css'

  const DAILY_BUDGET = 20

  function DinnerTracker() {
    const [records, setRecords] = useState([])
    const [status, setStatus] = useState('loading')
    const [statusMessage, setStatusMessage] = useState('正在加载数据...')
    const [spentInput, setSpentInput] = useState('')

    useEffect(() => {
      loadData()
    }, [])

    async function loadData() {
        try {
            setStatus('loading')
            setStatusMessage('正在加载数据...')
            const allRecords = await getAllDinnerRecords()
            setRecords(allRecords)
            setStatus('connected')
            setStatusMessage('已连接到服务器')
        } catch (error) {
            setStatus('error')
            setStatusMessage(`加载失败: ${error.message}`)
        }
    }

    function getTotalSaved() {
      return records.reduce((sum, r) => sum + r.saved, 0)
    }

    async function handleAddDinner() {
      const spent = parseFloat(spentInput)
      if (isNaN(spent) || spent < 0) {
        alert('请输入有效的花销金额')
        return
      }
      try {
        await addDinnerRecord(spent)
        await loadData()
        setSpentInput('')
      } catch (error) {
        setStatus('error')
        setStatusMessage(`添加失败: ${error.message}`)
      }
    }

    async function handleDeleteRecord(recordId) {
      try {
        await deleteDinnerRecord(recordId)
        await loadData()
      } catch (error) {
        setStatus('error')
        setStatusMessage(`删除失败: ${error.message}`)
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