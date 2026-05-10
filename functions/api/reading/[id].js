// 删除书籍（软删除）
export async function onRequestDelete(context) {
  const { DB } = context.env
  const { id } = context.params

  if (!id) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  // 软删除书籍
  const query = `UPDATE reading_books SET deleted = 1 WHERE id = ?`
  const result = await DB.prepare(query).bind(id).run()
  const changes = result.meta?.changes ?? 0

  if (changes === 0) {
    return Response.json({ error: 'Book not found' }, { status: 404 })
  }

  return Response.json({
    success: true,
    message: 'Book deleted successfully',
  })
}
