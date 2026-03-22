const express = require('express')
const cors = require('cors')
const path = require('path')
const ncmApi = require('NeteaseCloudMusicApi')

const app = express()
app.use(cors({ origin: true, credentials: true }))

// 将 NeteaseCloudMusicApi 的函数映射为 /api/* 路由
const router = express.Router()
Object.keys(ncmApi).forEach(key => {
  if (typeof ncmApi[key] !== 'function') return
  if (['default', 'serveNcmApi'].includes(key)) return

  const route = '/' + key.replace(/_/g, '/')
  router.all(route, async (req, res) => {
    try {
      const params = { ...req.query }
      if (req.query.cookie) params.cookie = req.query.cookie
      else if (req.headers.cookie) params.cookie = req.headers.cookie
      const result = await ncmApi[key](params)
      if (result.cookie) {
        result.cookie.forEach(c => res.append('Set-Cookie', c))
      }
      res.json(result.body || result)
    } catch (e) {
      res.status(500).json({ code: 500, msg: e.message })
    }
  })
})
app.use('/api', router)

// 生产环境 serve 前端静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
}

const PORT = process.env.PORT || 3300
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
