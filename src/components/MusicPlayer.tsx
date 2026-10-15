import React, { useRef } from 'react'
import YouTube, { type YouTubeProps, type YouTubeEvent } from 'react-youtube'
import type { Song } from '../types'
import { Music2, Sparkles } from 'lucide-react'
import { cleanArtistName } from '../utils/youtube'

interface MusicPlayerProps {
  currentSong: Song | null
  isPlaying: boolean
  onPlayerReady?: (player: any) => void
  onPlayerStateChange?: (state: number) => void
  onDurationChange?: (duration: number) => void
  volume?: number
  isMuted?: boolean
  showAutoplayUnlock?: boolean
  onUnlockAutoplay?: () => void
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentSong,
  isPlaying,
  onPlayerReady,
  onPlayerStateChange,
  onDurationChange,
  volume = 80,
  isMuted = false,
  showAutoplayUnlock = false,
  onUnlockAutoplay,
}) => {
  const internalPlayerRef = useRef<any>(null)

  const videoId = currentSong?.videoId || (currentSong?.url ? currentSong.url : 'GxldQ9eX2wo')

  const handleReady: YouTubeProps['onReady'] = (event: YouTubeEvent) => {
    internalPlayerRef.current = event.target
    if (volume !== undefined && typeof event.target.setVolume === 'function') {
      event.target.setVolume(volume)
    }
    if (isMuted && typeof event.target.mute === 'function') {
      event.target.mute()
    } else if (!isMuted && typeof event.target.unMute === 'function') {
      event.target.unMute()
    }

    if (typeof event.target.getDuration === 'function') {
      const duration = event.target.getDuration()
      if (duration && onDurationChange) {
        onDurationChange(Math.floor(duration))
      }
    }

    if (onPlayerReady) {
      onPlayerReady(event.target)
    }

    if (isPlaying && typeof event.target.playVideo === 'function') {
      event.target.playVideo()
    }
  }

  const handleStateChange: YouTubeProps['onStateChange'] = (event: YouTubeEvent) => {
    if (typeof event.target.getDuration === 'function') {
      const duration = event.target.getDuration()
      if (duration && duration > 0 && onDurationChange) {
        onDurationChange(Math.floor(duration))
      }
    }
    if (onPlayerStateChange) {
      onPlayerStateChange(event.data)
    }
  }

  const youtubeOpts: YouTubeProps['opts'] = {
    width: '1',
    height: '1',
    playerVars: {
      autoplay: isPlaying ? 1 : 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      playsinline: 1,
      rel: 0,
    },
  }

  if (!currentSong) {
    return (
      <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-white border border-[#f0dbe2] shadow-sm flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <div className="p-4 bg-[#fdf2f6] border border-[#f9a8d4] mb-3 text-[#ec4899]">
          <Music2 className="w-8 h-8" />
        </div>
        <p className="text-base font-bold text-[#1e1b1d] font-heading">Antrean Lagu Masih Kosong</p>
        <p className="text-xs text-zinc-500 mt-1">Cari dan tambahkan lagu favorit kalian berdua dari panel di samping.</p>
      </div>
    )
  }

  const formattedArtist = cleanArtistName(currentSong.artist)

  return (
    <div className="relative w-full bg-white border border-[#f0dbe2] shadow-sm p-5 sm:p-7 transition-all overflow-hidden">
      {/* OVERLAY USER GESTURE UNTUK UNLOCK AUTOPLAY BROWSER HP */}
      {showAutoplayUnlock && (
        <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
          <div className="bg-white border-2 border-zinc-900 shadow-2xl p-5 sm:p-6 max-w-sm w-full flex flex-col items-center">
            <div className="w-12 h-12 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <p className="font-heading font-black text-base text-[#1e1b1d] mb-1">
              Audio Menunggu Izin Browser
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              Browser HP memerlukan satu ketukan untuk memulai audio dan menyelaraskannya dengan pasangan.
            </p>
            <button
              type="button"
              onClick={onUnlockAutoplay}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#ec4899] hover:bg-[#db2777] active:scale-95 text-white font-extrabold text-sm border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all animate-bounce"
            >
              <Music2 className="w-4 h-4" />
              <span>Ketuk untuk Menyelaraskan Audio</span>
            </button>
          </div>
        </div>
      )}

      {/* 
        Sembunyikan IFrame Bawaan YouTube Standar di Luar Layar:
        Audio & API kontrol YouTube tetap berjalan 100% aktif di latar belakang tanpa menampilkan pemutar mentah.
      */}
      <div
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <YouTube
          videoId={videoId}
          opts={youtubeOpts}
          onReady={handleReady}
          onStateChange={handleStateChange}
        />
      </div>

      {/* Header Status Sesi Sederhana & Ramah Pengguna */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-100 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 bg-emerald-500 inline-block animate-pulse"></span>
            <span>Sesi Aktif</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
          <span>Ditambahkan oleh:</span>
          <span className="font-bold text-[#ec4899] px-2 py-0.5 bg-[#fdf2f6] border border-[#f9a8d4]">
            {currentSong.addedBy}
          </span>
        </div>
      </div>

      {/* 
        AREA TAMPILAN UTAMA:
        Cover Art / Thumbnail Lagu Bersih Berukuran Tajam 90 Derajat Lengkap dengan Info Lagu
      */}
      <div className="mt-5 w-full bg-[#faf7f8] border border-zinc-200 aspect-[16/10] sm:aspect-[2/1] flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 p-6 md:p-8">
        
        {/* Cover Art / Thumbnail Persegi Siku-Siku Tajam 90 Derajat */}
        <div className="relative shrink-0">
          <div className="w-36 h-36 sm:w-44 sm:h-44 bg-white border-2 border-zinc-900 shadow-md relative overflow-hidden group">
            <img
              src={currentSong.thumbnail}
              alt={currentSong.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
        </div>

        {/* Informasi Lagu & Animasi Visualizer Equalizer Gelombang Audio */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left max-w-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3 h-3 text-[#ec4899]" />
            <span>SEDANG DIPUTAR</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-heading text-[#1e1b1d] tracking-tight line-clamp-2">
            {currentSong.title}
          </h2>
          <p className="text-sm font-semibold text-zinc-500 font-sans mt-1 line-clamp-1">
            {formattedArtist}
          </p>

          {/* Equalizer Visualizer Bars Pink Solid Bersudut Siku Tajam */}
          <div className="flex items-end gap-1.5 mt-5 h-8">
            {[45, 80, 55, 95, 65, 90, 50, 85, 70, 55, 90, 60].map((height, idx) => (
              <span
                key={idx}
                className={`w-1.5 bg-[#ec4899] transition-all duration-300 ${
                  isPlaying ? 'opacity-100' : 'opacity-30'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(20, (height * (idx % 2 === 0 ? 0.9 : 1.1)) % 100)}%` : '20%',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

