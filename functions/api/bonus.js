// 获取 Bonus 项目和记录
export async function onRequestGet(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 获取所有项目及其当前次数
  if (action === 'items') {
    const query = `
      SELECT
        bi.id,
        bi.name,
        bi.value,
        bi.sort_order,
        COUNT(bh.id) as count
      FROM bonus_items bi
      LEFT JOIN bonus_history bh ON bi.id = bh.item_id
      GROUP BY bi.id
      ORDER BY bi.sort_order, bi.id
    `
    const result = await DB.prepare(query).all()
    const items = (result.results || []).map(r => ({
      id: r.id,
      name: r.name,
      value: r.value,
      count: r.count || 0,
      sort_order: r.sort_order || 0,
    }))

    return Response.json(items)
  }

  // 获取所有历史记录
  if (action === 'history') {
    const query = `
      SELECT
        bh.id,
        bh.item_id,
        bh.item_name,
        bh.amount,
        bh.recorded_at
      FROM bonus_history bh
      ORDER BY bh.recorded_at DESC
    `
    const result = await DB.prepare(query).all()
    const history = (result.results || []).map(r => {
      // 将 UTC 时间转换为本地时间（+8 小时）
      const [datePart, timePart] = r.recorded_at.split(' ')
      const [hour, minute, second] = timePart.split(':')

      let localHour = parseInt(hour) + 8
      let localDate = datePart

      // 处理跨天
      if (localHour >= 24) {
        localHour -= 24
        const dateObj = new Date(datePart)
        dateObj.setDate(dateObj.getDate() + 1)
        localDate = dateObj.toISOString().split('T')[0]
      }

      const localTime = `${String(localHour).padStart(2, '0')}:${minute}`

      return {
        id: r.id,
        itemId: r.item_id,
        itemName: r.item_name,
        amount: r.amount,
        date: localDate,
        time: localTime,
      }
    })

    return Response.json(history)
  }

  // 获取总积分
  if (action === 'total') {
    const query = `SELECT SUM(amount) as total FROM bonus_history`
    const result = await DB.prepare(query).first()
    return Response.json({ total: result?.total || 0 })
  }

  // 默认返回所有数据
  const [itemsResult, historyResult, totalResult] = await Promise.all([
    DB.prepare(`
      SELECT
        bi.id,
        bi.name,
        bi.value,
        bi.sort_order,
        COUNT(bh.id) as count
      FROM bonus_items bi
      LEFT JOIN bonus_history bh ON bi.id = bh.item_id
      GROUP BY bi.id
      ORDER BY bi.sort_order, bi.id
    `).all(),
    DB.prepare(`
      SELECT
        bh.id,
        bh.item_id,
        bh.item_name,
        bh.amount,
        bh.recorded_at
      FROM bonus_history bh
      ORDER BY bh.recorded_at DESC
    `).all(),
    DB.prepare(`SELECT SUM(amount) as total FROM bonus_history`).first(),
  ])

  const items = (itemsResult.results || []).map(r => ({
    id: r.id,
    name: r.name,
    value: r.value,
    count: r.count || 0,
    sort_order: r.sort_order || 0,
  }))

  const history = (historyResult.results || []).map(r => {
    const [datePart, timePart] = r.recorded_at.split(' ')
    const [hour, minute] = timePart.split(':')

    let localHour = parseInt(hour) + 8
    let localDate = datePart

    if (localHour >= 24) {
      localHour -= 24
      const dateObj = new Date(datePart)
      dateObj.setDate(dateObj.getDate() + 1)
      localDate = dateObj.toISOString().split('T')[0]
    }

    const localTime = `${String(localHour).padStart(2, '0')}:${minute}`

    return {
      id: r.id,
      itemId: r.item_id,
      itemName: r.item_name,
      amount: r.amount,
      date: localDate,
      time: localTime,
    }
  })

  return Response.json({
    items,
    history,
    total: totalResult?.total || 0,
  })
}

// 添加 Bonus 项目
export async function onRequestPost(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 添加积分记录（增加次数）
  if (action === 'increment') {
    const { itemId } = await context.request.json()

    if (!itemId) {
      return Response.json({ error: 'itemId is required' }, { status: 400 })
    }

    // 获取项目信息
    const itemResult = await DB.prepare(`SELECT id, name, value FROM bonus_items WHERE id = ?`)
      .bind(itemId)
      .first()

    if (!itemResult) {
      return Response.json({ error: 'Item not found' }, { status: 404 })
    }

    // 添加历史记录
    const query = `INSERT INTO bonus_history (item_id, item_name, amount) VALUES (?, ?, ?)`
    const result = await DB.prepare(query).bind(itemId, itemResult.name, itemResult.value).run()

    return Response.json({
      success: true,
      id: result.meta?.last_row_id,
      message: 'Record added successfully',
    })
  }

  // 添加新项目
  const { name, value, sort_order } = await context.request.json()

  if (!name || !value) {
    return Response.json({ error: 'name and value are required' }, { status: 400 })
  }

  const query = `INSERT INTO bonus_items (name, value, sort_order) VALUES (?, ?, ?)`
  const result = await DB.prepare(query).bind(name, value, sort_order || 0).run()

  return Response.json({
    success: true,
    id: result.meta?.last_row_id,
    message: 'Item added successfully',
  })
}

// 删除 Bonus 项目
export async function onRequestDelete(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 删除历史记录
  if (action === 'history') {
    const recordId = url.searchParams.get('id')

    if (!recordId) {
      return Response.json({ error: 'id is required' }, { status: 400 })
    }

    // 获取记录信息
    const recordResult = await DB.prepare(`SELECT item_id FROM bonus_history WHERE id = ?`)
      .bind(recordId)
      .first()

    if (!recordResult) {
      return Response.json({ error: 'Record not found' }, { status: 404 })
    }

    // 删除历史记录
    const query = `DELETE FROM bonus_history WHERE id = ?`
    const result = await DB.prepare(query).bind(recordId).run()
    const changes = result.meta?.changes ?? 0

    if (changes === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      message: 'History record deleted successfully',
    })
  }

  // 清空历史记录
  if (action === 'clear-history') {
    const query = `DELETE FROM bonus_history`
    const result = await DB.prepare(query).run()

    return Response.json({
      success: true,
      message: 'History cleared successfully',
      changes: result.meta?.changes ?? 0,
    })
  }

  // 删除项目
  const itemId = url.searchParams.get('id')

  if (!itemId) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  // 先删除该项目的历史记录
  await DB.prepare(`DELETE FROM bonus_history WHERE item_id = ?`).bind(itemId).run()

  // 删除项目
  const query = `DELETE FROM bonus_items WHERE id = ?`
  const result = await DB.prepare(query).bind(itemId).run()
  const changes = result.meta?.changes ?? 0

  if (changes === 0) {
    return Response.json({ error: 'Item not found' }, { status: 404 })
  }

  return Response.json({
    success: true,
    message: 'Item deleted successfully',
  })
}

// 更新项目（排序）
export async function onRequestPut(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 更新项目排序
  if (action === 'reorder') {
    const { items } = await context.request.json()

    if (!Array.isArray(items)) {
      return Response.json({ error: 'items array is required' }, { status: 400 })
    }

    // 批量更新排序
    for (let i = 0; i < items.length; i++) {
      await DB.prepare(`UPDATE bonus_items SET sort_order = ? WHERE id = ?`)
        .bind(i, items[i].id)
        .run()
    }

    return Response.json({
      success: true,
      message: 'Items reordered successfully',
    })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}