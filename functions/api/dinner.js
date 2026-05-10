// 获取晚饭攒钱记录
export async function onRequestGet(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const dateQuery = url.searchParams.get('date')
  const allQuery = url.searchParams.get('all')

  let query = `
    SELECT id, spent, saved, recorded_at
    FROM dinner_records
  `
  const params = []

  if (allQuery === 'true') {
    // 获取所有记录，不限制日期
    query += ` ORDER BY recorded_at DESC`
  } else if (dateQuery) {
    query += ` WHERE DATE(recorded_at) = ?`
    params.push(dateQuery)
    query += ` ORDER BY recorded_at DESC`
  } else {
    query += ` WHERE DATE(recorded_at) = DATE('now')`
    query += ` ORDER BY recorded_at DESC`
  }

  const result = await DB.prepare(query).bind(...params).all()
  const results = result.results || []

  // 格式化：只返回日期
  const formatted = results.map(r => {
    // 提取日期部分（如果有时间则只取日期部分，否则直接使用）
    const datePart = r.recorded_at.includes(' ')
      ? r.recorded_at.split(' ')[0]
      : r.recorded_at

    return {
      id: r.id,
      spent: r.spent,
      saved: r.saved,
      date: datePart,
    }
  })

  return Response.json(formatted)
}

// 添加晚饭攒钱记录
export async function onRequestPost(context) {
  const { DB } = context.env
  const { spent } = await context.request.json()

  if (spent === undefined || spent === null || spent < 0) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const DAILY_BUDGET = 20
  const saved = DAILY_BUDGET - spent

  const query = `INSERT INTO dinner_records (spent, saved) VALUES (?, ?)`
  const result = await DB.prepare(query).bind(spent, saved).run()

  return Response.json({
    success: true,
    id: result.meta?.last_row_id,
    saved: saved,
    message: 'Record added successfully',
  })
}