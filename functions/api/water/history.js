// 获取最近 7 天的喝水数据
export async function onRequestGet(context) {
  const { DB } = context.env

  const query = `
    SELECT
      DATE(recorded_at) as date,
      SUM(amount) as total
    FROM water_records
    WHERE DATE(recorded_at) >= DATE('now', '+8 hours', '-6 days')
    GROUP BY DATE(recorded_at)
    ORDER BY date ASC
  `

  const result = await DB.prepare(query).all()
  const results = result.results || []

  // 格式化日期并填充缺失的日期
  const history = []
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000)

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayRecord = results.find(r => r.date === dateStr)

    history.push({
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      total: dayRecord ? dayRecord.total : 0,
    })
  }

  return Response.json(history)
}
