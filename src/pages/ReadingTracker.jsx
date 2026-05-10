import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getReadingBooks,
  addReadingBook,
  toggleReadingBook,
  deleteReadingBook,
  addReadingChapter,
  toggleReadingChapter,
  deleteReadingChapter,
  reorderReadingBooks,
  getReadingStats,
} from '../api'
import './ReadingTracker.css'

function ReadingTracker() {
  const [books, setBooks] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0 })
  const [status, setStatus] = useState('loading')
  const [statusMessage, setStatusMessage] = useState('正在加载数据...')
  const [newBookTitle, setNewBookTitle] = useState('')
  const [expandedBookIds, setExpandedBookIds] = useState(new Set())
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [bookToDelete, setBookToDelete] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setStatus('loading')
      setStatusMessage('正在加载数据...')

      const [booksData, statsData] = await Promise.all([
        getReadingBooks(),
        getReadingStats(),
      ])

      setBooks(booksData)
      setStats(statsData)

      setStatus('connected')
      setStatusMessage('已连接到服务器')
    } catch (error) {
      setStatus('error')
      setStatusMessage(`加载失败: ${error.message}`)
    }
  }

  async function handleAddBook(e) {
    e?.preventDefault()
    const title = newBookTitle.trim()

    if (!title) {
      alert('请输入书籍名称')
      return
    }

    try {
      const sortOrder = books.length
      await addReadingBook(title, sortOrder)
      setNewBookTitle('')
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`添加失败: ${error.message}`)
    }
  }

  function handleToggleExpand(bookId) {
    setExpandedBookIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookId)) {
        newSet.delete(bookId)
      } else {
        newSet.add(bookId)
      }
      return newSet
    })
  }

  async function handleToggleBookComplete(bookId, currentCompleted) {
    try {
      await toggleReadingBook(bookId, !currentCompleted)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`更新失败: ${error.message}`)
    }
  }

  function handleShowDeleteModal(bookId) {
    setBookToDelete(bookId)
    setShowDeleteModal(true)
  }

  function handleCloseDeleteModal() {
    setBookToDelete(null)
    setShowDeleteModal(false)
  }

  async function handleConfirmDeleteBook() {
    if (!bookToDelete) return

    try {
      await deleteReadingBook(bookToDelete)
      await loadData()
      handleCloseDeleteModal()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`删除失败: ${error.message}`)
    }
  }

  async function handleAddChapter(bookId, chapterNumber, chapterName) {
    if (!chapterNumber) {
      alert('请输入章节号')
      return
    }
    if (!chapterName) {
      alert('请输入章节名称')
      return
    }

    try {
      // 保持书籍展开状态
      setExpandedBookIds(prev => new Set([...prev, bookId]))
      await addReadingChapter(bookId, chapterNumber, chapterName)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`添加失败: ${error.message}`)
    }
  }

  async function handleToggleChapterComplete(bookId, chapterId, currentCompleted) {
    try {
      await toggleReadingChapter(bookId, chapterId, !currentCompleted)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`更新失败: ${error.message}`)
    }
  }

  async function handleDeleteChapter(bookId, chapterId) {
    if (!confirm('确定要删除这个章节吗？')) return

    try {
      await deleteReadingChapter(bookId, chapterId)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`删除失败: ${error.message}`)
    }
  }

  // 拖拽处理
  function handleDragStart(index) {
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  async function handleDrop(targetIndex) {
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const newBooks = [...books]
    const [movedBook] = newBooks.splice(draggedIndex, 1)
    newBooks.splice(targetIndex, 0, movedBook)

    try {
      await reorderReadingBooks(newBooks)
      await loadData()
    } catch (error) {
      setStatus('error')
      setStatusMessage(`排序失败: ${error.message}`)
    }
  }

  function calculateBookProgress(book) {
    const total = book.chapters.length
    const completed = book.chapters.filter(c => c.completed).length
    return { completed, total, percentage: total > 0 ? completed / total : 0 }
  }

  function generateProgressRing(percentage) {
    const radius = 7
    const circumference = radius * 2 * Math.PI
    const offset = circumference - percentage * circumference

    return (
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 20 20" 
        style={{ display: 'block', flexShrink: 0 }}
      >
        <circle r={radius} cx="10" cy="10" fill="transparent" stroke="#e0e0e0" strokeWidth="3" />
        <circle 
          r={radius} 
          cx="10" 
          cy="10" 
          fill="transparent" 
          stroke="#667eea" 
          strokeWidth="3" 
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          transform="rotate(-90 10 10)" 
        />
      </svg>
    )
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="reading-tracker">
      <Link to="/" className="back-btn">
        <span>←</span>
        <span>返回主页</span>
      </Link>

      <div className="header">
        <h1>📚 读书记录</h1>
        <div className="stats">
          <div className="stat-item">
            <div className="stat-label">总书籍</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">已完成</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* 状态指示 */}
      <div className={`status-indicator ${status}`}>{statusMessage}</div>

      {/* 书籍列表 */}
      <div className="books-list">
        {books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <div>暂无书籍，请添加新书籍</div>
          </div>
        ) : (
          books.map((book, index) => {
            const isExpanded = expandedBookIds.has(book.id)
            const progress = calculateBookProgress(book)

            return (
              <div
                key={book.id}
                className={`book-item ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(index)}
              >
                <div
                  className="book-header"
                  onClick={() => handleToggleExpand(book.id)}
                >
                  <div className="drag-handle">⋮⋮</div>
                  <div className={`book-title ${book.completed ? 'completed' : ''}`}>
                    {book.title}
                  </div>
                  <div className="book-progress">
                    {generateProgressRing(progress.percentage)}
                    <span>{progress.completed}/{progress.total}</span>
                  </div>
                  <div className="book-actions">
                    {book.completedDate && (
                      <span className="completed-date">{formatDate(book.completedDate)} 完成</span>
                    )}
                    <button
                      className={`toggle-complete-btn ${book.completed ? 'completed' : ''}`}
                      onClick={e => {
                        e.stopPropagation()
                        handleToggleBookComplete(book.id, book.completed)
                      }}
                    >
                      {book.completed ? '取消完成' : '标记完成'}
                    </button>
                    <button
                      className="delete-book-btn"
                      onClick={e => {
                        e.stopPropagation()
                        handleShowDeleteModal(book.id)
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="chapters-container">
                    <div className="chapters-list">
                      {book.chapters.length === 0 ? (
                        <div className="empty-chapters">暂无章节</div>
                      ) : (
                        book.chapters.map(chapter => (
                          <div key={chapter.id} className="chapter-item">
                            <input
                              type="checkbox"
                              className="chapter-checkbox"
                              checked={chapter.completed}
                              onChange={() => handleToggleChapterComplete(book.id, chapter.id, chapter.completed)}
                            />
                            <span className="chapter-number">{chapter.chapterNumber}</span>
                            <span className={`chapter-name ${chapter.completed ? 'completed' : ''}`}>
                              {chapter.chapterName}
                            </span>
                            {chapter.completedDate && (
                              <span className="chapter-date">{formatDate(chapter.completedDate)}</span>
                            )}
                            <button
                              className="chapter-delete"
                              onClick={() => handleDeleteChapter(book.id, chapter.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <AddChapterForm bookId={book.id} onAdd={handleAddChapter} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 添加新书籍 */}
      <form className="add-book-form" onSubmit={handleAddBook}>
        <input
          type="text"
          placeholder="输入书籍名称"
          value={newBookTitle}
          onChange={e => setNewBookTitle(e.target.value)}
        />
        <button type="submit">添加书籍</button>
      </form>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">确认删除</div>
            <div className="modal-message">
              确定要删除这本书及其所有章节吗？
              <br />
              数据将被标记为删除状态，不会再显示在列表中。
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={handleCloseDeleteModal}>
                取消
              </button>
              <button className="modal-btn confirm" onClick={handleConfirmDeleteBook}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 添加章节表单组件
function AddChapterForm({ bookId, onAdd }) {
  const [chapterNumber, setChapterNumber] = useState('')
  const [chapterName, setChapterName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onAdd(bookId, chapterNumber, chapterName)
    setChapterNumber('')
    setChapterName('')
  }

  return (
    <form className="add-chapter-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chapter-number-input"
        placeholder="章节号"
        value={chapterNumber}
        onChange={e => setChapterNumber(e.target.value)}
      />
      <input
        type="text"
        placeholder="章节名称"
        value={chapterName}
        onChange={e => setChapterName(e.target.value)}
      />
      <button type="submit" className="add-chapter-btn">
        添加章节
      </button>
    </form>
  )
}

export default ReadingTracker
