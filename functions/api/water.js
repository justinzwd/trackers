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
    query += ` WHERE DATE(recorded_at) = DATE('now', '+8 hours')`
  }

  query += ` ORDER BY recorded_at DESC`

  const result = await DB.prepare(query).bind(...params).all()
  const results = result.results || []

  const formatted = results.map(r => {
    const [datePart, timePart] = r.recorded_at.split(' ')
    const [hour, minute] = timePart.split(':')
    return {
      id: r.id,
      amount: r.amount,
      time: `${hour}:${minute}`,
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

  const query = `INSERT INTO water_records (amount, recorded_at) VALUES (?, DATETIME('now', '+8 hours'))`
  const result = await DB.prepare(query).bind(amount).run()

  return Response.json({
    success: true,
    id: result.meta?.last_row_id,
    message: 'Record added successfully',
  })
}
