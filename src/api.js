const BASE = '/api'

function qs(params) {
  return new URLSearchParams(params).toString()
}

// 获取二维码 key
export async function getQRKey() {
  const ts = Date.now()
  const res = await fetch(`${BASE}/login/qr/key?timestamp=${ts}`)
  const data = await res.json()
  return data.data.unikey
}

// 生成二维码图片(base64)
export async function createQR(key) {
  const res = await fetch(`${BASE}/login/qr/create?key=${key}&qrimg=true&timestamp=${Date.now()}`)
  const data = await res.json()
  return data.data.qrimg
}

// 检查扫码状态
export async function checkQR(key) {
  const res = await fetch(`${BASE}/login/qr/check?key=${key}&timestamp=${Date.now()}`)
  const data = await res.json()
  // code: 800=过期 801=等待扫码 802=已扫码待确认 803=登录成功
  return data
}

// 获取登录状态 / 用户信息
export async function getLoginStatus(cookie) {
  const res = await fetch(`${BASE}/login/status?timestamp=${Date.now()}&cookie=${encodeURIComponent(cookie)}`)
  return res.json()
}

// 获取最近播放 (最多300首)
export async function getRecentSongs(cookie) {
  const res = await fetch(`${BASE}/record/recent/song?limit=300&cookie=${encodeURIComponent(cookie)}`)
  return res.json()
}

// 获取用户听歌排行 (type=1 最近一周)
export async function getUserRecord(uid, cookie) {
  const res = await fetch(`${BASE}/user/record?uid=${uid}&type=1&cookie=${encodeURIComponent(cookie)}`)
  return res.json()
}

// 获取用户详情
export async function getUserDetail(uid, cookie) {
  const res = await fetch(`${BASE}/user/detail?uid=${uid}&cookie=${encodeURIComponent(cookie)}`)
  return res.json()
}

// 获取歌曲百科摘要 (含流派标签)
export async function getSongWiki(id, cookie) {
  const res = await fetch(`${BASE}/song/wiki/summary?id=${id}&cookie=${encodeURIComponent(cookie)}`)
  return res.json()
}

// 获取用户风格偏好
export async function getStylePreference(cookie) {
  const res = await fetch(`${BASE}/style/preference?cookie=${encodeURIComponent(cookie)}`)
  return res.json()
}

// 听歌足迹 - 周收听报告（含实际收听时长）
export async function getListenReport(cookie, type = 'week') {
  const res = await fetch(`${BASE}/listen/data/report?type=${type}&cookie=${encodeURIComponent(cookie)}`)
  return res.json()
}

