import React, { useState, useRef, useEffect, useCallback } from 'react'
import { toPng } from 'html-to-image'
import Receipt from './Receipt'
import { getQRKey, createQR, checkQR, getLoginStatus, getUserRecord, getUserDetail, getSongWiki, getListenReport } from './api'
import './App.css'

// week 模式: 网易云听歌排行，每条自带 playCount
function aggregateWeekly(records, days) {
  const trackMap = new Map()
  const artistMap = new Map()
  let totalDuration = 0
  let totalPlays = 0

  records.forEach(r => {
    const song = r.song
    const playCount = r.playCount || 1
    const id = song.id
    const duration = song.dt || song.duration || 0
    const artists = (song.ar || song.artists || []).map(a => a.name).join(', ')

    totalDuration += duration * playCount
    totalPlays += playCount

    trackMap.set(id, { name: song.name, artists, count: playCount })

    ;(song.ar || song.artists || []).forEach(a => {
      if (artistMap.has(a.id)) {
        artistMap.get(a.id).count += playCount
      } else {
        artistMap.set(a.id, { name: a.name, count: playCount })
      }
    })
  })

  return buildResult(trackMap, artistMap, totalPlays, totalDuration, days)
}

function buildResult(trackMap, artistMap, totalSongs, totalDuration, days) {
  const totalArtists = artistMap.size
  const totalMinutes = Math.round(totalDuration / 60000)
  const avgPerDay = Math.round(totalMinutes / days)

  const topTracks = [...trackMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const topArtists = [...artistMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  // 所有去重歌曲 ID 及播放次数，用于流派统计
  const allSongIds = [...trackMap.entries()].map(([id, data]) => ({ id, count: data.count }))

  return { totalSongs, totalArtists, totalMinutes, avgPerDay, topTracks, topArtists, allSongIds, totalPlays: totalSongs }
}

const DEMO_DATA = {
  totalSongs: 86,
  totalArtists: 23,
  totalMinutes: 841,
  avgPerDay: 120,
  topTracks: [
    { name: 'Bohemian Rhapsody', artists: 'Queen', count: 18 },
    { name: 'Blinding Lights', artists: 'The Weeknd', count: 14 },
    { name: 'Stairway to Heaven', artists: 'Led Zeppelin', count: 11 },
    { name: 'Watermelon Sugar', artists: 'Harry Styles', count: 9 },
    { name: 'Levitating', artists: 'Dua Lipa', count: 7 },
  ],
  topArtists: [
    { name: 'Queen', count: 32 },
    { name: 'The Weeknd', count: 24 },
    { name: 'Dua Lipa', count: 18 },
  ],
  genreMix: [
    { name: '摇滚', percent: 38 },
    { name: '流行', percent: 29 },
    { name: '电子', percent: 19 },
    { name: '其他', percent: 14 },
  ],
  userId: '2048673',
  nickname: 'music_lover',
  date: '2026/03/23 10:30',
}

export default function App() {
  const [step, setStep] = useState('login') // login | loading | result
  const [qrImg, setQrImg] = useState(null)
  const [qrStatus, setQrStatus] = useState('')
  const [cookie, setCookie] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [mode, setMode] = useState('week')
  const [receiptData, setReceiptData] = useState(null)
  const [error, setError] = useState('')
  const pollingRef = useRef(null)
  const receiptRef = useRef(null)

  // 生成二维码
  const startLogin = useCallback(async () => {
    try {
      setError('')
      setQrStatus('正在生成二维码...')
      const key = await getQRKey()
      const img = await createQR(key)
      setQrImg(img)
      setQrStatus('请使用网易云音乐 APP 扫码登录')

      // 轮询检查
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkQR(key)
          if (res.code === 803) {
            clearInterval(pollingRef.current)
            setCookie(res.cookie || '')
            setQrStatus('登录成功！')
            // 获取用户信息
            const status = await getLoginStatus(res.cookie || '')
            const profile = status.data?.profile
            if (profile) {
              const info = { uid: profile.userId, nickname: profile.nickname }
              setUserInfo(info)
              localStorage.setItem('music-receipt-auth', JSON.stringify({ cookie: res.cookie, userInfo: info }))
            }
            setStep('select')
          } else if (res.code === 800) {
            clearInterval(pollingRef.current)
            setQrStatus('二维码已过期，请重新生成')
          } else if (res.code === 802) {
            setQrStatus('已扫码，请在手机上确认登录')
          }
        } catch {
          // ignore polling errors
        }
      }, 2000)
    } catch (e) {
      setError('生成二维码失败: ' + e.message)
    }
  }, [])

  // 启动时尝试从 localStorage 恢复登录态
  useEffect(() => {
    const saved = localStorage.getItem('music-receipt-auth')
    if (!saved) return
    try {
      const { cookie: savedCookie, userInfo: savedUser } = JSON.parse(saved)
      if (!savedCookie || !savedUser) return
      getLoginStatus(savedCookie).then(status => {
        if (status.data?.profile?.userId) {
          setCookie(savedCookie)
          setUserInfo(savedUser)
          setStep('select')
        } else {
          localStorage.removeItem('music-receipt-auth')
        }
      }).catch(() => localStorage.removeItem('music-receipt-auth'))
    } catch {
      localStorage.removeItem('music-receipt-auth')
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('music-receipt-auth')
    setCookie('')
    setUserInfo(null)
    setReceiptData(null)
    setQrImg(null)
    setQrStatus('')
    setStep('login')
  }, [])

  // 生成小票
  const generateReceipt = useCallback(async (selectedMode) => {
    setMode(selectedMode)
    setStep('loading')
    setError('')
    try {
      const [recordRes, reportRes] = await Promise.all([
        getUserRecord(userInfo.uid, cookie),
        getListenReport(cookie, 'week').catch(() => null),
      ])
      const records = recordRes.weekData || []
      let processed = records.length > 0 ? aggregateWeekly(records, 7) : null

      // 用报告接口的实际收听时长替换估算值
      if (processed) {
        const reportMinutes = reportRes?.data?.weekData?.playTime ?? null
        if (reportMinutes != null && reportMinutes > 0) {
          processed = { ...processed, totalMinutes: reportMinutes, avgPerDay: Math.round(reportMinutes / 7) }
        }
      }

      if (!processed) {
        setError('该时间段内没有播放记录')
        setStep('select')
        return
      }

      // 用 song_wiki_summary 获取全量歌曲的流派标签 (songTag)
      let genreMix
      try {
        // 分批并发，每批10个，避免请求过多
        const allSongs = processed.allSongIds
        const wikiResults = []
        for (let i = 0; i < allSongs.length; i += 10) {
          const batch = allSongs.slice(i, i + 10)
          const batchResults = await Promise.all(
            batch.map(s => getSongWiki(s.id, cookie).catch(() => null))
          )
          wikiResults.push(...batchResults)
        }
        const genreMap = new Map()
        let unknownPlays = 0
        allSongs.forEach((s, i) => {
          const wiki = wikiResults[i]
          const blocks = wiki?.data?.blocks || []
          const basicBlock = blocks.find(b => b.code === 'SONG_PLAY_ABOUT_SONG_BASIC')
          const tagCreative = basicBlock && (basicBlock.creatives || []).find(c => c.creativeType === 'songTag')
          const tags = tagCreative
            ? (tagCreative.resources || []).map(r => r?.uiElement?.mainTitle?.title).filter(Boolean)
            : []

          if (tags.length === 0) {
            unknownPlays += s.count
            return
          }

          // 按标签数均分 playCount，避免多标签歌曲重复计入导致分母虚高
          const share = s.count / tags.length
          tags.forEach(tag => {
            const genre = tag.split('-')[0] || tag
            if (genreMap.has(genre)) {
              genreMap.get(genre).count += share
            } else {
              genreMap.set(genre, { name: genre, count: share })
            }
          })
        })

        // 无标签歌曲并入「其他」，确保分母 = 实际总播放次数
        if (unknownPlays > 0) {
          const existing = genreMap.get('其他')
          genreMap.set('其他', { name: '其他', count: (existing?.count || 0) + unknownPlays })
        }

        if (genreMap.size > 0) {
          const totalForGenre = processed.totalPlays
          genreMix = [...genreMap.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
            .map(g => ({ name: g.name, percent: Math.round((g.count / totalForGenre) * 100) }))
          const usedPercent = genreMix.reduce((s, g) => s + g.percent, 0)
          if (usedPercent < 100) {
            const otherIdx = genreMix.findIndex(g => g.name === '其他')
            if (otherIdx >= 0) {
              genreMix[otherIdx].percent += 100 - usedPercent
            } else {
              genreMix.push({ name: '其他', percent: 100 - usedPercent })
            }
          }
        }
      } catch {
        // 流派获取失败时使用 fallback
      }

      // fallback: 用 top artists 名字代替
      if (!genreMix || genreMix.length === 0) {
        const topArtistsForGenre = processed.topArtists.slice(0, 4)
        const totalPlays = processed.totalPlays
        genreMix = topArtistsForGenre.map(a => ({
          name: a.name,
          percent: Math.round((a.count / totalPlays) * 100)
        }))
        const usedPercent = genreMix.reduce((s, g) => s + g.percent, 0)
        if (usedPercent < 100) {
          genreMix.push({ name: '其他', percent: 100 - usedPercent })
        }
      }

      const now = new Date()
      setReceiptData({
        ...processed,
        genreMix,
        userId: userInfo.uid,
        nickname: userInfo.nickname,
        date: now.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      })
      setStep('result')
    } catch (e) {
      setError('获取数据失败: ' + e.message)
      setStep('select')
    }
  }, [cookie, userInfo])

  // 下载图片
  const downloadImage = useCallback(async () => {
    const node = document.getElementById('receipt')
    if (!node) return
    try {
      const dataUrl = await toPng(node, { pixelRatio: 3, backgroundColor: '#f5f0eb' })
      const link = document.createElement('a')
      link.download = `music-receipt-${mode}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      setError('导出图片失败: ' + e.message)
    }
  }, [mode])


  return (
    <div className="app">
      <h1 className="app-title">Music Receipt</h1>
      <p className="app-desc">将你的网易云音乐听歌记录生成小票风格图片</p>

      {error && <div className="error">{error}</div>}

      {step === 'login' && (
        <div className="login-section">
          {qrImg ? (
            <div className="qr-container">
              <img src={qrImg} alt="QR Code" className="qr-img" />
              <p className="qr-status">{qrStatus}</p>
              <button className="btn btn-secondary" onClick={startLogin}>刷新二维码</button>
            </div>
          ) : (
            <>
              <div className="demo-receipt-wrapper">
                <Receipt data={DEMO_DATA} />
                <div className="demo-overlay">
                  <span>扫码登录，生成你的小票</span>
                </div>
              </div>
              <button className="btn" onClick={startLogin} style={{ marginTop: 24 }}>扫码登录网易云音乐</button>
            </>
          )}
        </div>
      )}

      {step === 'select' && (
        <div className="select-section">
          <p className="welcome">👋 {userInfo?.nickname}，选择时间范围：</p>
          <div className="btn-group">
            <button className="btn" onClick={() => generateReceipt('week')}>过去 7 天</button>
            <button className="btn btn-secondary" onClick={logout}>退出登录</button>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="loading">
          <div className="spinner" />
          <p>正在生成你的 Music Receipt...</p>
        </div>
      )}

      {step === 'result' && (
        <div className="result-section">
          <div className="receipt-wrapper">
            <Receipt data={receiptData} mode={mode} />
          </div>
          <div className="btn-group" style={{ marginTop: 20 }}>
            <button className="btn" onClick={downloadImage}>下载图片</button>
            <button className="btn btn-secondary" onClick={() => setStep('select')}>重新选择</button>
          </div>
        </div>
      )}
    </div>
  )
}
