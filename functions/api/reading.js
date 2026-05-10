// 获取所有书籍及其章节
export async function onRequestGet(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 获取书籍列表（不含章节）
  if (action === 'books') {
    const query = `
      SELECT
        id,
        title,
        completed,
        completed_date,
        sort_order
      FROM reading_books
      WHERE deleted = 0
      ORDER BY sort_order, id
    `
    const result = await DB.prepare(query).all()
    const books = (result.results || []).map(r => ({
      id: r.id,
      title: r.title,
      completed: r.completed === 1,
      completedDate: r.completed_date,
      sortOrder: r.sort_order || 0,
    }))

    return Response.json(books)
  }

  // 获取某本书的章节
  if (action === 'chapters') {
    const bookId = url.searchParams.get('bookId')

    if (!bookId) {
      return Response.json({ error: 'bookId is required' }, { status: 400 })
    }

    const query = `
      SELECT
        id,
        chapter_number as chapterNumber,
        chapter_name as chapterName,
        completed,
        completed_date as completedDate
      FROM reading_chapters
      WHERE book_id = ?
      ORDER BY id
    `
    const result = await DB.prepare(query).bind(bookId).all()
    const chapters = (result.results || []).map(r => ({
      id: r.id,
      chapterNumber: r.chapterNumber,
      chapterName: r.chapterName,
      completed: r.completed === 1,
      completedDate: r.completedDate,
    }))

    return Response.json(chapters)
  }

  // 获取统计数据
  if (action === 'stats') {
    const booksResult = await DB.prepare(`
      SELECT COUNT(*) as total,
             SUM(completed) as completed
      FROM reading_books
      WHERE deleted = 0
    `).first()

    return Response.json({
      total: booksResult?.total || 0,
      completed: booksResult?.completed || 0,
    })
  }

  // 默认返回所有数据
  const booksResult = await DB.prepare(`
    SELECT
      id,
      title,
      completed,
      completed_date as completedDate,
      sort_order as sortOrder
    FROM reading_books
    WHERE deleted = 0
    ORDER BY sort_order, id
  `).all()

  const books = await Promise.all(
    (booksResult.results || []).map(async book => {
      const chaptersResult = await DB.prepare(`
        SELECT
          id,
          chapter_number as chapterNumber,
          chapter_name as chapterName,
          completed,
          completed_date as completedDate
        FROM reading_chapters
        WHERE book_id = ?
        ORDER BY id
      `).bind(book.id).all()

      return {
        id: book.id,
        title: book.title,
        completed: book.completed === 1,
        completedDate: book.completedDate,
        sortOrder: book.sortOrder || 0,
        chapters: (chaptersResult.results || []).map(r => ({
          id: r.id,
          chapterNumber: r.chapterNumber,
          chapterName: r.chapterName,
          completed: r.completed === 1,
          completedDate: r.completedDate,
        })),
      }
    })
  )

  return Response.json(books)
}

// 添加书籍或章节
export async function onRequestPost(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 添加章节
  if (action === 'chapter') {
    const { bookId, chapterNumber, chapterName } = await context.request.json()

    if (!bookId || !chapterNumber || !chapterName) {
      return Response.json({ error: 'bookId, chapterNumber and chapterName are required' }, { status: 400 })
    }

    // 如果书已完成，添加新章节时取消书的完成状态
    const book = await DB.prepare(`SELECT id FROM reading_books WHERE id = ?`).bind(bookId).first()
    if (book) {
      await DB.prepare(`UPDATE reading_books SET completed = 0, completed_date = NULL WHERE id = ?`)
        .bind(bookId)
        .run()
    }

    const query = `
      INSERT INTO reading_chapters (book_id, chapter_number, chapter_name, completed)
      VALUES (?, ?, ?, 0)
    `
    const result = await DB.prepare(query).bind(bookId, chapterNumber, chapterName).run()

    return Response.json({
      success: true,
      id: result.meta?.last_row_id,
      message: 'Chapter added successfully',
    })
  }

  // 添加书籍
  const { title, sortOrder } = await context.request.json()

  if (!title) {
    return Response.json({ error: 'title is required' }, { status: 400 })
  }

  const query = `
    INSERT INTO reading_books (title, completed, sort_order, deleted)
    VALUES (?, 0, ?, 0)
  `
  const result = await DB.prepare(query).bind(title, sortOrder || 0).run()

  return Response.json({
    success: true,
    id: result.meta?.last_row_id,
    message: 'Book added successfully',
  })
}

// 更新书籍或章节
export async function onRequestPut(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 切换书籍完成状态
  if (action === 'toggle-book') {
    const { bookId, completed } = await context.request.json()

    if (!bookId) {
      return Response.json({ error: 'bookId is required' }, { status: 400 })
    }

    const completedDate = completed ? new Date().toISOString().split('T')[0] : null

    const query = `UPDATE reading_books SET completed = ?, completed_date = ? WHERE id = ?`
    const result = await DB.prepare(query).bind(completed ? 1 : 0, completedDate, bookId).run()
    const changes = result.meta?.changes ?? 0

    if (changes === 0) {
      return Response.json({ error: 'Book not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      message: 'Book status updated successfully',
    })
  }

  // 切换章节完成状态
  if (action === 'toggle-chapter') {
    const { bookId, chapterId, completed } = await context.request.json()

    if (!bookId || !chapterId) {
      return Response.json({ error: 'bookId and chapterId are required' }, { status: 400 })
    }

    const completedDate = completed ? new Date().toISOString().split('T')[0] : null

    const query = `UPDATE reading_chapters SET completed = ?, completed_date = ? WHERE id = ?`
    const result = await DB.prepare(query).bind(completed ? 1 : 0, completedDate, chapterId).run()

    // 检查是否所有章节都完成了
    const chaptersResult = await DB.prepare(`
      SELECT COUNT(*) as total, SUM(completed) as completed
      FROM reading_chapters
      WHERE book_id = ?
    `).bind(bookId).first()

    const allCompleted = chaptersResult?.total > 0 && chaptersResult.total === chaptersResult.completed

    // 更新书籍完成状态
    await DB.prepare(`
      UPDATE reading_books
      SET completed = ?, completed_date = ?
      WHERE id = ?
    `).bind(allCompleted ? 1 : 0, allCompleted ? new Date().toISOString().split('T')[0] : null, bookId).run()

    return Response.json({
      success: true,
      message: 'Chapter status updated successfully',
    })
  }

  // 重新排序书籍
  if (action === 'reorder') {
    const { books } = await context.request.json()

    if (!Array.isArray(books)) {
      return Response.json({ error: 'books array is required' }, { status: 400 })
    }

    // 批量更新排序
    for (let i = 0; i < books.length; i++) {
      await DB.prepare(`UPDATE reading_books SET sort_order = ? WHERE id = ?`)
        .bind(i, books[i].id)
        .run()
    }

    return Response.json({
      success: true,
      message: 'Books reordered successfully',
    })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}

// 删除章节
export async function onRequestDelete(context) {
  const { DB } = context.env
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')

  // 删除章节
  if (action === 'chapter') {
    const chapterId = url.searchParams.get('id')
    const bookId = url.searchParams.get('bookId')

    if (!chapterId || !bookId) {
      return Response.json({ error: 'chapterId and bookId are required' }, { status: 400 })
    }

    const query = `DELETE FROM reading_chapters WHERE id = ?`
    const result = await DB.prepare(query).bind(chapterId).run()
    const changes = result.meta?.changes ?? 0

    if (changes === 0) {
      return Response.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // 检查是否所有章节都完成了
    const chaptersResult = await DB.prepare(`
      SELECT COUNT(*) as total, SUM(completed) as completed
      FROM reading_chapters
      WHERE book_id = ?
    `).bind(bookId).first()

    const allCompleted = chaptersResult?.total > 0 && chaptersResult.total === chaptersResult.completed

    // 更新书籍完成状态
    await DB.prepare(`
      UPDATE reading_books
      SET completed = ?, completed_date = ?
      WHERE id = ?
    `).bind(allCompleted ? 1 : 0, allCompleted ? new Date().toISOString().split('T')[0] : null, bookId).run()

    return Response.json({
      success: true,
      message: 'Chapter deleted successfully',
    })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
