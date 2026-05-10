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
