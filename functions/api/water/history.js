// 获取最近 7 天的喝水数据
export async function onRequestGet(context) {
  const { DB } = context.env

  const query = `
    SELECT
      DATE(recorded_at) as date,
      SUM(amount) as total
    FROM water_records
    GROUP BY DATE(recorded_at)
    ORDER BY date ASC
    LIMIT 30
  `

  const result = await DB.prepare(query).all()
  const results = result.results || []

  // 获取今天日期（使用 UTC）
  const now = new Date()

  // 格式化日期并填充缺失的日期 - 正序（从早到晚）
  const history = []
  // 从6天前开始
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)

    // 转换为 UTC 日期用于查询
    const utcDate = new Date(date.getTime() - (8 * 60 * 60 * 1000))
    const utcDateStr = utcDate.toISOString().split('T')[0]

    // 用 UTC 日期匹配（因为数据库存的是 UTC）
    const dayRecord = results.find(r => r.date === utcDateStr)

    history.push({
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      total: dayRecord ? dayRecord.total : 0,
    })
  }

  // 由于循环是从6天前到今天，history 已经是正序（早→晚）
  // 不需要再 reverse
  return Response.json(history)
}
