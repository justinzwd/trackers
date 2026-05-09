// 获取某天的喝水记录
export async function onRequestGet(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const dateQuery = url.searchParams.get('date')

  let query = `
    SELECT id, amount, recorded_at
    FROM water_records
  `
  const params = []

  if (dateQuery) {
    query += ` WHERE DATE(recorded_at) = ?`
    params.push(dateQuery)
  } else {
    query += ` WHERE DATE(recorded_at) = DATE('now')`
  }

  query += ` ORDER BY recorded_at DESC`

  const result = await DB.prepare(query).bind(...params).all()
  const results = result.results || []

  // 格式化时间 - 将 UTC 时间转换为中国时间（+8 小时）
  const formatted = results.map(r => {
    // recorded_at 格式是 "2026-05-09 16:07:55"（UTC 时间）
    // 需要转换为中国时间（UTC+8）
    const [datePart, timePart] = r.recorded_at.split(' ')
    const [hour, minute] = timePart.split(':')

    // 转换为中国时间（加 8 小时，处理跨天）
    let chinaHour = parseInt(hour) + 8
    if (chinaHour >= 24) {
      chinaHour -= 24
    }

    const chinaTimeStr = `${String(chinaHour).padStart(2, '0')}:${minute}`
    return {
      id: r.id,
      amount: r.amount,
      time: chinaTimeStr,
    }
  })

  return Response.json(formatted)
}

// 添加喝水记录
export async function onRequestPost(context) {
  const { DB } = context.env
  const { amount } = await context.request.json()

  if (!amount || amount <= 0) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const query = `INSERT INTO water_records (amount) VALUES (?)`
  const result = await DB.prepare(query).bind(amount).run()

  return Response.json({
    success: true,
    id: result.meta?.last_row_id,
    message: 'Record added successfully',
  })
}
