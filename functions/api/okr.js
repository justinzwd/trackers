// OKR 目标管理 API
export async function onRequestGet(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 获取某个目标的打卡记录
  if (action === 'records') {
    const goalId = url.searchParams.get('goalId')
    if (!goalId) {
      return Response.json({ error: 'goalId is required' }, { status: 400 })
    }

    const result = await DB.prepare(`
      SELECT id, goal_id, recorded_at
      FROM okr_records
      WHERE goal_id = ?
      ORDER BY recorded_at DESC
    `).bind(goalId).all()

    const records = (result.results || []).map(r => {
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

      return {
        id: r.id,
        goalId: r.goal_id,
        date: localDate,
        time: `${String(localHour).padStart(2, '0')}:${minute}`,
      }
    })

    return Response.json(records)
  }

  // 默认：获取所有未删除的目标
  const goalsResult = await DB.prepare(`
    SELECT id, name, target_count, completed_count, completed, completed_date, sort_order, created_at
    FROM okr_goals
    WHERE deleted = 0
    ORDER BY completed ASC, sort_order ASC, id DESC
  `).all()

  const goals = (goalsResult.results || []).map(g => ({
    id: g.id,
    name: g.name,
    targetCount: g.target_count,
    completedCount: g.completed_count,
    completed: g.completed === 1,
    completedDate: g.completed_date,
    sortOrder: g.sort_order,
  }))

  return Response.json({ goals })
}

// 添加目标 / 打卡 +1
export async function onRequestPost(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 打卡 +1
  if (action === 'increment') {
    const { goalId } = await context.request.json()

    if (!goalId) {
      return Response.json({ error: 'goalId is required' }, { status: 400 })
    }

    // 获取目标信息
    const goal = await DB.prepare(`SELECT id, target_count, completed_count, completed FROM okr_goals WHERE id = ? AND deleted = 0`)
      .bind(goalId)
      .first()

    if (!goal) {
      return Response.json({ error: 'Goal not found' }, { status: 404 })
    }

    if (goal.completed === 1) {
      return Response.json({ error: 'Goal already completed' }, { status: 400 })
    }

    // 插入打卡记录
    await DB.prepare(`INSERT INTO okr_records (goal_id) VALUES (?)`)
      .bind(goalId)
      .run()

    // 更新已完成次数
    const newCount = goal.completed_count + 1
    const isCompleted = newCount >= goal.target_count

    if (isCompleted) {
      const now = new Date()
      const localDate = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]
      await DB.prepare(`UPDATE okr_goals SET completed_count = ?, completed = 1, completed_date = ? WHERE id = ?`)
        .bind(newCount, localDate, goalId)
        .run()
    } else {
      await DB.prepare(`UPDATE okr_goals SET completed_count = ? WHERE id = ?`)
        .bind(newCount, goalId)
        .run()
    }

    return Response.json({
      success: true,
      completedCount: newCount,
      completed: isCompleted,
    })
  }

  // 添加新目标
  const { name, targetCount } = await context.request.json()

  if (!name || !targetCount) {
    return Response.json({ error: 'name and targetCount are required' }, { status: 400 })
  }

  if (targetCount <= 0) {
    return Response.json({ error: 'targetCount must be positive' }, { status: 400 })
  }

  const result = await DB.prepare(`INSERT INTO okr_goals (name, target_count) VALUES (?, ?)`)
    .bind(name, targetCount)
    .run()

  return Response.json({
    success: true,
    id: result.meta?.last_row_id,
  })
}

// 删除目标（软删除） / 删除打卡记录（真正删除）
export async function onRequestDelete(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 删除打卡记录
  if (action === 'record') {
    const recordId = url.searchParams.get('id')
    if (!recordId) {
      return Response.json({ error: 'id is required' }, { status: 400 })
    }

    // 获取记录所属的目标
    const record = await DB.prepare(`SELECT goal_id FROM okr_records WHERE id = ?`)
      .bind(parseInt(recordId))
      .first()

    if (!record) {
      return Response.json({ error: 'Record not found' }, { status: 404 })
    }

    // 删除记录
    await DB.prepare(`DELETE FROM okr_records WHERE id = ?`).bind(parseInt(recordId)).run()

    // 扣减目标已完成次数
    const goal = await DB.prepare(`SELECT id, completed_count, completed FROM okr_goals WHERE id = ?`)
      .bind(record.goal_id)
      .first()

    if (goal) {
      const newCount = Math.max(0, goal.completed_count - 1)
      // 如果之前已完成，现在要重新标记为未完成
      await DB.prepare(`UPDATE okr_goals SET completed_count = ?, completed = 0, completed_date = NULL WHERE id = ?`)
        .bind(newCount, record.goal_id)
        .run()
    }

    return Response.json({ success: true })
  }

  // 软删除目标
  const goalId = url.searchParams.get('id')
  if (!goalId) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  const result = await DB.prepare(`UPDATE okr_goals SET deleted = 1 WHERE id = ? AND deleted = 0`)
    .bind(parseInt(goalId))
    .run()

  if (result.meta?.changes === 0) {
    return Response.json({ error: 'Goal not found' }, { status: 404 })
  }

  return Response.json({ success: true })
}
