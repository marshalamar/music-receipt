const express = require('express')
const cors = require('cors')
const ncmApi = require('NeteaseCloudMusicApi')

const app = express()
app.use(cors({ origin: true, credentials: true }))

// 将 NeteaseCloudMusicApi 的函数映射为 HTTP 路由
// 函数名如 login_qr_key => 路由 /login/qr/key
Object.keys(ncmApi).forEach(key => {
  if (typeof ncmApi[key] !== 'function') return
  if (['default', 'serveNcmApi'].includes(key)) return

  const route = '/' + key.replace(/_/g, '/')
  app.all(route, async (req, res) => {
    try {
      const params = { ...req.query }
      if (req.query.cookie) params.cookie = req.query.cookie
      else if (req.headers.cookie) params.cookie = req.headers.cookie
      const result = await ncmApi[key](params)
      // 透传 set-cookie
      if (result.cookie) {
        result.cookie.forEach(c => res.append('Set-Cookie', c))
      }
      res.json(result.body || result)
    } catch (e) {
      res.status(500).json({ code: 500, msg: e.message })
    }
  })
})

const PORT = process.env.API_PORT || 3300
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
