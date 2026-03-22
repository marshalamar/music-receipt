const express = require('express')
const cors = require('cors')
const ncmApi = require('NeteaseCloudMusicApi')

const app = express()
app.use(cors({ origin: true, credentials: true }))

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

module.exports = app
