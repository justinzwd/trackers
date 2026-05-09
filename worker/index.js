export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 添加 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // 健康检查
    if (url.pathname === '/') {
      return Response.json({
        status: 'ok',
        message: 'Trackers API is running',
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders })
    }

    // 获取某天的喝水记录
    if (url.pathname === '/api/water' && request.method === 'GET') {
      try {
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

        const result = await env.DB.prepare(query).bind(...params).all()
        const results = result.results || []

        return Response.json(results, { headers: corsHeaders })
      } catch (error) {
        return Response.json({ error: error.message }, {
          status: 500,
          headers: corsHeaders
        })
      }
    }

    // 获取最近 7 天的喝水数据
    if (url.pathname === '/api/water/history' && request.method === 'GET') {
      try {
        const query = `
          SELECT
            DATE(recorded_at) as date,
            SUM(amount) as total
          FROM water_records
          WHERE DATE(recorded_at) >= DATE('now', '-6 days')
          GROUP BY DATE(recorded_at)
          ORDER BY date
        `

        const result = await env.DB.prepare(query).all()
        const results = result.results || []

        // 格式化日期并填充缺失的日期
        const history = []
        const today = new Date()

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(today.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const dayRecord = results.find(r => r.date === dateStr)

          history.push({
            date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            total: dayRecord ? dayRecord.total : 0,
          })
        }

        return Response.json(history, { headers: corsHeaders })
      } catch (error) {
        return Response.json({ error: error.message }, {
          status: 500,
          headers: corsHeaders
        })
      }
    }

    // 添加喝水记录
    if (url.pathname === '/api/water' && request.method === 'POST') {
      try {
        const { amount } = await request.json()

        if (!amount || amount <= 0) {
          return Response.json({ error: 'Invalid amount' }, {
            status: 400,
            headers: corsHeaders
          })
        }

        const query = `INSERT INTO water_records (amount) VALUES (?)`
        const result = await env.DB.prepare(query).bind(amount).run()

        return Response.json({
          success: true,
          id: result.meta?.last_row_id,
          message: 'Record added successfully',
        }, { headers: corsHeaders })
      } catch (error) {
        return Response.json({ error: error.message }, {
          status: 500,
          headers: corsHeaders
        })
      }
    }

    // 删除喝水记录
    if (url.pathname.match(/^\/api\/water\/\d+$/) && request.method === 'DELETE') {
      try {
        const recordId = url.pathname.split('/').pop()
        const query = `DELETE FROM water_records WHERE id = ?`
        const result = await env.DB.prepare(query).bind(recordId).run()
        const changes = result.meta?.changes ?? 0

        if (changes === 0) {
          return Response.json({ error: 'Record not found' }, {
            status: 404,
            headers: corsHeaders
          })
        }

        return Response.json({
          success: true,
          message: 'Record deleted successfully',
        }, { headers: corsHeaders })
      } catch (error) {
        return Response.json({ error: error.message }, {
          status: 500,
          headers: corsHeaders
        })
      }
    }

    // 404
    return new Response('Not Found', { status: 404, headers: corsHeaders })
  }
}

