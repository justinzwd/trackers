// 批量同步 API - 接收前端缓存队列中的操作并执行
export async function onRequestPost(context) {
  const { DB } = context.env
  const { tool, operations } = await context.request.json()

  if (!tool || !Array.isArray(operations) || operations.length === 0) {
    return Response.json({ error: 'tool and operations are required' }, { status: 400 })
  }

  const results = []

  for (const op of operations) {
    try {
      const result = await executeOperation(DB, tool, op)
      results.push({ success: true, ...result })
    } catch (e) {
      results.push({ success: false, error: e.message })
    }
  }

  return Response.json({ success: true, results })
}

async function executeOperation(DB, tool, op) {
  switch (tool) {
    case 'water':
      return executeWaterOp(DB, op)
    case 'dinner':
      return executeDinnerOp(DB, op)
    case 'bonus':
      return executeBonusOp(DB, op)
    case 'reading':
      return executeReadingOp(DB, op)
    case 'okr':
      return executeOkrOp(DB, op)
    default:
      throw new Error(`Unknown tool: ${tool}`)
  }
}

// ========== Water ==========
async function executeWaterOp(DB, op) {
  switch (op.type) {
    case 'add': {
      const { amount } = op.payload
      await DB.prepare(`INSERT INTO water_records (amount) VALUES (?)`).bind(amount).run()
      return {}
    }
    case 'delete': {
      const { id } = op.payload
      await DB.prepare(`DELETE FROM water_records WHERE id = ?`).bind(id).run()
      return {}
    }
    default:
      throw new Error(`Unknown water op: ${op.type}`)
  }
}

// ========== Dinner ==========
async function executeDinnerOp(DB, op) {
  switch (op.type) {
    case 'add': {
      const { spent, saved } = op.payload
      await DB.prepare(`INSERT INTO dinner_records (spent, saved) VALUES (?, ?)`)
        .bind(spent, saved).run()
      return {}
    }
    case 'delete': {
      const { id } = op.payload
      await DB.prepare(`DELETE FROM dinner_records WHERE id = ?`).bind(id).run()
      return {}
    }
    default:
      throw new Error(`Unknown dinner op: ${op.type}`)
  }
}

// ========== Bonus ==========
async function executeBonusOp(DB, op) {
  switch (op.type) {
    case 'addItem': {
      const { name, value, sort_order } = op.payload
      await DB.prepare(`INSERT INTO bonus_items (name, value, sort_order) VALUES (?, ?, ?)`)
        .bind(name, value, sort_order || 0).run()
      return {}
    }
    case 'increment': {
      const { itemId, itemName, itemValue } = op.payload
      await DB.prepare(`INSERT INTO bonus_history (item_id, item_name, amount) VALUES (?, ?, ?)`)
        .bind(itemId, itemName, itemValue).run()
      return {}
    }
    case 'deleteItem': {
      const { id } = op.payload
      await DB.prepare(`DELETE FROM bonus_history WHERE item_id = ?`).bind(id).run()
      await DB.prepare(`DELETE FROM bonus_items WHERE id = ?`).bind(id).run()
      return {}
    }
    case 'deleteHistory': {
      const { id } = op.payload
      await DB.prepare(`DELETE FROM bonus_history WHERE id = ?`).bind(id).run()
      return {}
    }
    case 'clearHistory': {
      await DB.prepare(`DELETE FROM bonus_history`).run()
      return {}
    }
    case 'reorder': {
      const { items } = op.payload
      for (let i = 0; i < items.length; i++) {
        await DB.prepare(`UPDATE bonus_items SET sort_order = ? WHERE id = ?`)
          .bind(i, items[i].id).run()
      }
      return {}
    }
    default:
      throw new Error(`Unknown bonus op: ${op.type}`)
  }
}

// ========== Reading ==========
async function executeReadingOp(DB, op) {
  switch (op.type) {
    case 'addBook': {
      const { title, sortOrder } = op.payload
      await DB.prepare(`INSERT INTO reading_books (title, completed, sort_order, deleted) VALUES (?, 0, ?, 0)`)
        .bind(title, sortOrder || 0).run()
      return {}
    }
    case 'addChapter': {
      const { bookId, chapterNumber, chapterName } = op.payload
      // 添加章节时取消书的完成状态
      await DB.prepare(`UPDATE reading_books SET completed = 0, completed_date = NULL WHERE id = ?`)
        .bind(bookId).run()
      await DB.prepare(`INSERT INTO reading_chapters (book_id, chapter_number, chapter_name, completed) VALUES (?, ?, ?, 0)`)
        .bind(bookId, chapterNumber, chapterName).run()
      return {}
    }
    case 'toggleBook': {
      const { bookId, completed } = op.payload
      const completedDate = completed ? new Date().toISOString().split('T')[0] : null
      await DB.prepare(`UPDATE reading_books SET completed = ?, completed_date = ? WHERE id = ?`)
        .bind(completed ? 1 : 0, completedDate, bookId).run()
      return {}
    }
    case 'toggleChapter': {
      const { bookId, chapterId, completed } = op.payload
      const completedDate = completed ? new Date().toISOString().split('T')[0] : null
      await DB.prepare(`UPDATE reading_chapters SET completed = ?, completed_date = ? WHERE id = ?`)
        .bind(completed ? 1 : 0, completedDate, chapterId).run()
      // 检查是否所有章节都完成
      const chaptersResult = await DB.prepare(`
        SELECT COUNT(*) as total, SUM(completed) as completed
        FROM reading_chapters WHERE book_id = ?
      `).bind(bookId).first()
      const allCompleted = chaptersResult?.total > 0 && chaptersResult.total === chaptersResult.completed
      await DB.prepare(`UPDATE reading_books SET completed = ?, completed_date = ? WHERE id = ?`)
        .bind(allCompleted ? 1 : 0, allCompleted ? new Date().toISOString().split('T')[0] : null, bookId).run()
      return {}
    }
    case 'deleteBook': {
      const { bookId } = op.payload
      await DB.prepare(`UPDATE reading_books SET deleted = 1 WHERE id = ?`).bind(bookId).run()
      return {}
    }
    case 'deleteChapter': {
      const { bookId, chapterId } = op.payload
      await DB.prepare(`DELETE FROM reading_chapters WHERE id = ?`).bind(chapterId).run()
      // 更新书籍完成状态
      const chaptersResult = await DB.prepare(`
        SELECT COUNT(*) as total, SUM(completed) as completed
        FROM reading_chapters WHERE book_id = ?
      `).bind(bookId).first()
      const allCompleted = chaptersResult?.total > 0 && chaptersResult.total === chaptersResult.completed
      await DB.prepare(`UPDATE reading_books SET completed = ?, completed_date = ? WHERE id = ?`)
        .bind(allCompleted ? 1 : 0, allCompleted ? new Date().toISOString().split('T')[0] : null, bookId).run()
      return {}
    }
    case 'reorder': {
      const { books } = op.payload
      for (let i = 0; i < books.length; i++) {
        await DB.prepare(`UPDATE reading_books SET sort_order = ? WHERE id = ?`)
          .bind(i, books[i].id).run()
      }
      return {}
    }
    default:
      throw new Error(`Unknown reading op: ${op.type}`)
  }
}

// ========== OKR ==========
async function executeOkrOp(DB, op) {
  switch (op.type) {
    case 'addGoal': {
      const { name, targetCount } = op.payload
      await DB.prepare(`INSERT INTO okr_goals (name, target_count) VALUES (?, ?)`)
        .bind(name, targetCount).run()
      return {}
    }
    case 'increment': {
      const { goalId } = op.payload
      // 插入打卡记录
      await DB.prepare(`INSERT INTO okr_records (goal_id) VALUES (?)`).bind(goalId).run()
      // 更新计数
      const goal = await DB.prepare(`SELECT target_count, completed_count FROM okr_goals WHERE id = ?`)
        .bind(goalId).first()
      if (goal) {
        const newCount = goal.completed_count + 1
        const isCompleted = newCount >= goal.target_count
        if (isCompleted) {
          const now = new Date()
          const localDate = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]
          await DB.prepare(`UPDATE okr_goals SET completed_count = ?, completed = 1, completed_date = ? WHERE id = ?`)
            .bind(newCount, localDate, goalId).run()
        } else {
          await DB.prepare(`UPDATE okr_goals SET completed_count = ? WHERE id = ?`)
            .bind(newCount, goalId).run()
        }
      }
      return {}
    }
    case 'deleteGoal': {
      const { goalId } = op.payload
      await DB.prepare(`UPDATE okr_goals SET deleted = 1 WHERE id = ?`).bind(goalId).run()
      return {}
    }
    case 'deleteRecord': {
      const { recordId, goalId } = op.payload
      await DB.prepare(`DELETE FROM okr_records WHERE id = ?`).bind(recordId).run()
      // 扣减计数
      const goal = await DB.prepare(`SELECT completed_count FROM okr_goals WHERE id = ?`)
        .bind(goalId).first()
      if (goal) {
        const newCount = Math.max(0, goal.completed_count - 1)
        await DB.prepare(`UPDATE okr_goals SET completed_count = ?, completed = 0, completed_date = NULL WHERE id = ?`)
          .bind(newCount, goalId).run()
      }
      return {}
    }
    default:
      throw new Error(`Unknown okr op: ${op.type}`)
  }
}
