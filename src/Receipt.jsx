import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './Receipt.css'

export default function Receipt({ data }) {
  if (!data) return null

  const { totalSongs, totalArtists, totalMinutes, avgPerDay, topTracks, topArtists, genreMix, userId, nickname, date } = data

  return (
    <div className="receipt" id="receipt">
      <div className="receipt-header">
        <div className="receipt-logo">♪ MUSIC RECEIPT ♪</div>
        <div className="receipt-stars">✦ ✦ ✦</div>
        <div className="receipt-sub">{nickname}</div>
        <div className="receipt-date">{date}</div>
        <div className="receipt-mode">PAST 7 DAYS</div>
      </div>

      <hr className="receipt-divider" />

      <div className="receipt-section">
        <div className="receipt-row">
          <span>SONGS PLAYED</span>
          <span>{totalSongs}</span>
        </div>
        <div className="receipt-row">
          <span>ARTISTS</span>
          <span>{totalArtists}</span>
        </div>
        <div className="receipt-row">
          <span>TOTAL TIME</span>
          <span>{totalMinutes} min</span>
        </div>
        <div className="receipt-row">
          <span>AVG / DAY</span>
          <span>{avgPerDay} min</span>
        </div>
      </div>

      <hr className="receipt-divider" />

      <div className="receipt-section">
        <div className="receipt-section-title">TOP 5 TRACKS</div>
        {topTracks.map((t, i) => (
          <div className={`receipt-track${i === 0 ? ' receipt-track-top' : ''}`} key={i}>
            <div className="receipt-row">
              <span className="track-name">{i === 0 ? '★ ' : `${i + 1}. `}{t.name}</span>
              <span>x{t.count}</span>
            </div>
            {t.artists && <div className="track-artist">{t.artists}</div>}
          </div>
        ))}
      </div>

      <hr className="receipt-divider" />

      <div className="receipt-section">
        <div className="receipt-section-title">TOP 3 ARTISTS</div>
        {topArtists.map((a, i) => (
          <div className="receipt-row" key={i}>
            <span>{i + 1}. {a.name}</span>
            <span>{a.count} plays</span>
          </div>
        ))}
      </div>

      <hr className="receipt-divider" />

      <div className="receipt-section">
        <div className="receipt-section-title">GENRE MIX</div>
        {genreMix.map((g, i) => (
          <div className="genre-row" key={i}>
            <span className="genre-name">{g.name}</span>
            <div className="genre-right">
              <div className="genre-bar-track">
                <div className="genre-bar-fill" style={{ width: `${g.percent}%` }} />
              </div>
              <span className="genre-percent">{g.percent}%</span>
            </div>
          </div>
        ))}
      </div>

      <hr className="receipt-divider" />

      <div className="receipt-footer">
        <div className="receipt-qrcode">
          <QRCodeSVG
            value={`https://music.163.com/user/home?id=${userId}`}
            size={80}
            bgColor="transparent"
            fgColor="currentColor"
            level="L"
          />
        </div>
        <div className="receipt-uid">UID: {userId}</div>
        <div className="receipt-thanks">THANK YOU FOR LISTENING</div>
        <div className="receipt-powered">
          <a href="https://github.com/marshalamar/music-receipt" target="_blank" rel="noopener noreferrer">
            <svg className="github-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            marshalamar/music-receipt
          </a>
        </div>
      </div>
    </div>
  )
}
