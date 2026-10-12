import React, { useRef } from 'react'
import YouTube, { type YouTubeProps, type YouTubeEvent } from 'react-youtube'
import type { Song } from '../types'
import { Music2, Sparkles, CheckCircle2, Radio } from 'lucide-react'

interface MusicPlayerProps {
  currentSong: Song | null
  isPlaying: boolean
  onPlayerReady?: (player: any) => void
  onPlayerStateChange?: (state: number) => void
  onDurationChange?: (duration: number) => void
  volume?: number
  isMuted?: boolean
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentSong,
  isPlaying,
  onPlayerReady,
  onPlayerStateChange,
  onDurationChange,
  volume = 80,
  isMuted = false,
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

  return (
    <div className="relative w-full bg-white border border-[#f0dbe2] shadow-sm p-5 sm:p-7 transition-all">
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

      {/* Header Status Sinkronisasi Pasangan (Sharp Box Badges) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-100 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Sinkron Real-Time &bull; Supabase Connected</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 text-zinc-600 text-[11px] font-semibold">
            <Radio className="w-3 h-3 text-[#ec4899]" />
            <span>Audio Sinkron</span>
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
        AREA TAMPILAN UTAMA (MENGGANTIKAN NATIVE YOUTUBE IFRAME):
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
            {/* Lencana Status Sudut Tajam */}
            <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-[#ec4899] text-white text-[10px] font-bold tracking-wider uppercase">
              {isPlaying ? 'Memutar' : 'Jeda'}
            </div>
          </div>
        </div>

        {/* Informasi Lagu & Animasi Visualizer Equalizer Gelombang Audio */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left max-w-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3 h-3 text-[#ec4899]" />
            <span>Sedang Diputar Bersama</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-heading text-[#1e1b1d] tracking-tight line-clamp-2">
            {currentSong.title}
          </h2>
          <p className="text-sm font-semibold text-zinc-500 font-sans mt-1 line-clamp-1">
            {currentSong.artist}
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

          <p className="text-[11px] text-zinc-400 mt-3 font-mono">
            {isPlaying ? 'Audio terhubung & sinkron dengan pasangan' : 'Pemutaran sedang dijeda'}
          </p>
        </div>
      </div>
    </div>
  )
}
