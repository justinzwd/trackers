// 删除喝水记录
export async function onRequestDelete(context) {
  const { DB } = context.env
  const recordId = context.params.id

  const query = `DELETE FROM water_records WHERE id = ?`
  const result = await DB.prepare(query).bind(recordId).run()
  const changes = result.meta?.changes ?? 0

  if (changes === 0) {
    return Response.json({ error: 'Record not found' }, { status: 404 })
  }

  return Response.json({
    success: true,
    message: 'Record deleted successfully',
  })
}