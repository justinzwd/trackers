// API 配置
// 开发环境使用本地代理，生产环境使用相对路径（同源）
const API_BASE = import.meta.env.DEV
  ? '/api'
  : '/api'

// 通用 API 请求函数
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}

// ============ 喝水记录相关 API ============

// 获取某天的喝水记录
export async function getWaterRecords(date = null) {
  const dateParam = date ? `?date=${date}` : ''
  return apiRequest(`/water${dateParam}`)
}

// 获取最近 7 天的喝水数据
export async function getWaterHistory() {
  return apiRequest(`/water/history`)
}

// 添加喝水记录
export async function addWaterRecord(amount) {
  return apiRequest(`/water`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
}

// 删除喝水记录
export async function deleteWaterRecord(recordId) {
  return apiRequest(`/water/${recordId}`, {
    method: 'DELETE',
  })
}

// 获取今日总喝水量
export async function getTodayTotal() {
  const today = new Date().toISOString().split('T')[0]
  const records = await getWaterRecords(today)
  return records.reduce((sum, r) => sum + r.amount, 0)
}

// ============ 晚饭攒钱相关 API ============

// 获取某天的晚饭记录
export async function getDinnerRecords(date = null) {
  const dateParam = date ? `?date=${date}` : ''
  return apiRequest(`/dinner${dateParam}`)
}

// 添加晚饭记录
export async function addDinnerRecord(spent) {
  return apiRequest(`/dinner`, {
    method: 'POST',
    body: JSON.stringify({ spent }),
  })
}

// 删除晚饭记录
export async function deleteDinnerRecord(recordId) {
  return apiRequest(`/dinner/${recordId}`, {
    method: 'DELETE',
  })
}

// 获取所有晚饭记录
export async function getAllDinnerRecords() {
  return apiRequest(`/dinner?all=true`)
}

// ============ Bonus 积分相关 API ============

// 获取所有 Bonus 数据
export async function getBonusData() {
  return apiRequest(`/bonus`)
}

// 获取 Bonus 项目列表
export async function getBonusItems() {
  return apiRequest(`/bonus?action=items`)
}

// 获取 Bonus 历史记录
export async function getBonusHistory() {
  return apiRequest(`/bonus?action=history`)
}

// 获取总积分
export async function getBonusTotal() {
  return apiRequest(`/bonus?action=total`)
}

// 添加新 Bonus 项目
export async function addBonusItem(name, value) {
  return apiRequest(`/bonus`, {
    method: 'POST',
    body: JSON.stringify({ name, value }),
  })
}

// 增加积分记录
export async function incrementBonusCount(itemId) {
  return apiRequest(`/bonus?action=increment`, {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  })
}

// 删除 Bonus 项目
export async function deleteBonusItem(itemId) {
  return apiRequest(`/bonus?action=delete&id=${itemId}`, {
    method: 'DELETE',
  })
}

// 删除 Bonus 历史记录
export async function deleteBonusHistory(recordId) {
  return apiRequest(`/bonus?action=history&id=${recordId}`, {
    method: 'DELETE',
  })
}

// 清空历史记录
export async function clearBonusHistory() {
  return apiRequest(`/bonus?action=clear-history`, {
    method: 'DELETE',
  })
}

// 重新排序项目
export async function reorderBonusItems(items) {
  return apiRequest(`/bonus?action=reorder`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

// ============ 读书记录相关 API ============

// 获取所有书籍及其章节
export async function getReadingBooks() {
  return apiRequest(`/reading`)
}

// 获取书籍列表（不含章节）
export async function getReadingBooksList() {
  return apiRequest(`/reading?action=books`)
}

// 获取某本书的章节
export async function getReadingChapters(bookId) {
  return apiRequest(`/reading?action=chapters&bookId=${bookId}`)
}

// 获取统计数据
export async function getReadingStats() {
  return apiRequest(`/reading?action=stats`)
}

// 添加书籍
export async function addReadingBook(title, sortOrder = 0) {
  return apiRequest(`/reading`, {
    method: 'POST',
    body: JSON.stringify({ title, sortOrder }),
  })
}

// 添加章节
export async function addReadingChapter(bookId, chapterNumber, chapterName) {
  return apiRequest(`/reading?action=chapter`, {
    method: 'POST',
    body: JSON.stringify({ bookId, chapterNumber, chapterName }),
  })
}

// 切换书籍完成状态
export async function toggleReadingBook(bookId, completed) {
  return apiRequest(`/reading?action=toggle-book`, {
    method: 'PUT',
    body: JSON.stringify({ bookId, completed }),
  })
}

// 切换章节完成状态
export async function toggleReadingChapter(bookId, chapterId, completed) {
  return apiRequest(`/reading?action=toggle-chapter`, {
    method: 'PUT',
    body: JSON.stringify({ bookId, chapterId, completed }),
  })
}

// 删除书籍
export async function deleteReadingBook(bookId) {
  return apiRequest(`/reading/${bookId}`, {
    method: 'DELETE',
  })
}

// 删除章节
export async function deleteReadingChapter(bookId, chapterId) {
  return apiRequest(`/reading?action=chapter&id=${chapterId}&bookId=${bookId}`, {
    method: 'DELETE',
  })
}

// 重新排序书籍
export async function reorderReadingBooks(books) {
  return apiRequest(`/reading?action=reorder`, {
    method: 'PUT',
    body: JSON.stringify({ books }),
  })
}
