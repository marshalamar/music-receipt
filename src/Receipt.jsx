import React from 'react'
import './Receipt.css'

export default function Receipt({ data }) {
  if (!data) return null

  const { totalSongs, totalArtists, totalMinutes, avgPerDay, topTracks, topArtists, genreMix, userId, nickname, date } = data

  return (
    <div className="receipt" id="receipt">
      <div className="receipt-header">
        <div className="receipt-logo">♪ MUSIC RECEIPT ♪</div>
        <div className="receipt-sub">{nickname}</div>
        <div className="receipt-date">{date}</div>
        <div className="receipt-mode">PAST 7 DAYS</div>
      </div>

      <div className="receipt-divider">{'─'.repeat(32)}</div>

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

      <div className="receipt-divider">{'─'.repeat(32)}</div>

      <div className="receipt-section">
        <div className="receipt-section-title">TOP 5 TRACKS</div>
        {topTracks.map((t, i) => (
          <div className="receipt-row" key={i}>
            <span className="track-name">{i + 1}. {t.name}</span>
            <span>x{t.count}</span>
          </div>
        ))}
      </div>

      <div className="receipt-divider">{'─'.repeat(32)}</div>

      <div className="receipt-section">
        <div className="receipt-section-title">TOP 3 ARTISTS</div>
        {topArtists.map((a, i) => (
          <div className="receipt-row" key={i}>
            <span>{i + 1}. {a.name}</span>
            <span>{a.count} plays</span>
          </div>
        ))}
      </div>

      <div className="receipt-divider">{'─'.repeat(32)}</div>

      <div className="receipt-section">
        <div className="receipt-section-title">GENRE MIX</div>
        {genreMix.map((g, i) => (
          <div className="receipt-row" key={i}>
            <span>{g.name}</span>
            <span>{g.percent}%</span>
          </div>
        ))}
      </div>

      <div className="receipt-divider">{'─'.repeat(32)}</div>

      <div className="receipt-footer">
        <div className="receipt-barcode">
          {String(userId).split('').map((d, i) => (
            <span key={i} className={`bar bar-${d}`} />
          ))}
        </div>
        <div className="receipt-uid">UID: {userId}</div>
        <div className="receipt-thanks">THANK YOU FOR LISTENING</div>
        <div className="receipt-powered">powered by music-receipt</div>
      </div>
    </div>
  )
}
