import React, { useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Shuffle,
  Repeat,
  RotateCcw,
  Heart,
} from 'lucide-react'

interface ControlPanelProps {
  isPlaying: boolean
  onTogglePlay: () => void
  onSkipNext: () => void
  onSkipPrev: () => void
  currentTimeSeconds: number
  totalDurationSeconds: number
  onSeek: (seconds: number) => void
  onSendHeart: () => void
  onTriggerResync?: () => void
  volume?: number
  onVolumeChange?: (vol: number) => void
  isMuted?: boolean
  onToggleMute?: () => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
  currentTimeSeconds,
  totalDurationSeconds,
  onSeek,
  onSendHeart,
  onTriggerResync,
  volume = 80,
  onVolumeChange,
  isMuted = false,
  onToggleMute,
}) => {
  const [internalVolume, setInternalVolume] = useState(volume)
  const [internalMuted, setInternalMuted] = useState(isMuted)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [syncStatusText, setSyncStatusText] = useState('')

  const activeVolume = onVolumeChange ? volume : internalVolume
  const activeMuted = onToggleMute ? isMuted : internalMuted

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, Math.floor(secs || 0))
    const m = Math.floor(safeSecs / 60)
    const s = Math.floor(safeSecs % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value))
  }

  const handleVolumeToggle = () => {
    if (onToggleMute) {
      onToggleMute()
    } else {
      setInternalMuted(!internalMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (onVolumeChange) {
      onVolumeChange(val)
    } else {
      setInternalVolume(val)
    }
  }

  const handleResync = () => {
    setSyncStatusText('Sinkronisasi disesuaikan')
    if (onTriggerResync) {
      onTriggerResync()
    }
    setTimeout(() => setSyncStatusText(''), 2000)
  }

  const progressPercent = totalDurationSeconds > 0
    ? (currentTimeSeconds / totalDurationSeconds) * 100
    : 0

  return (
    <div className="w-full bg-white border border-[#f0dbe2] shadow-sm p-5 sm:p-6 space-y-4">
      {/* SEEK BAR FLAT SOLID PINK (Sharp Rectangular Bar) */}
      <div className="space-y-1.5">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={totalDurationSeconds || 100}
            value={currentTimeSeconds}
            onChange={handleSeekChange}
            aria-label="Progres durasi lagu"
            className="w-full h-2 appearance-none cursor-pointer bg-zinc-200 accent-[#ec4899] focus:outline-none"
            style={{
              background: `linear-gradient(to right, #ec4899 ${progressPercent}%, #e4e4e7 ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Label Waktu Berjalan & Total */}
        <div className="flex justify-between items-center text-xs font-mono text-zinc-500 px-0.5">
          <span className="text-[#ec4899] font-bold">{formatTime(currentTimeSeconds)}</span>
          {syncStatusText && (
            <span className="text-[11px] text-[#ec4899] font-sans font-semibold">
              {syncStatusText}
            </span>
          )}
          <span className="font-semibold">{formatTime(totalDurationSeconds)}</span>
        </div>
      </div>

      {/* BARIS KONTROL UTAMA: STRICTLY SHARP RECTANGLES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        
        {/* Kontrol Sisi Kiri: Shuffle, Repeat, Sync */}
        <div className="flex items-center gap-1.5 order-2 sm:order-1">
          <button
            type="button"
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2.5 transition-colors cursor-pointer border ${
              isShuffle
                ? 'bg-[#fdf2f6] text-[#ec4899] border-[#f9a8d4]'
                : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
            title="Acak antrean"
            aria-label="Acak antrean"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsRepeat(!isRepeat)}
            className={`p-2.5 transition-colors cursor-pointer border ${
              isRepeat
                ? 'bg-[#fdf2f6] text-[#ec4899] border-[#f9a8d4]'
                : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
            title="Ulangi lagu"
            aria-label="Ulangi lagu"
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResync}
            className="p-2.5 bg-white text-zinc-500 border border-zinc-200 hover:text-[#ec4899] hover:bg-[#fdf2f6] transition-colors cursor-pointer"
            title="Kunci sinkronisasi ulang dengan pasangan"
            aria-label="Kunci sinkronisasi ulang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* KONTROL UTAMA: PREV, PLAY/PAUSE (KOTAK TAJAM PINK SOLID), NEXT */}
        <div className="flex items-center gap-2.5 sm:gap-3 order-1 sm:order-2">
          {/* Tombol Lewati Sebelumnya (Kotak Tajam) */}
          <button
            type="button"
            onClick={onSkipPrev}
            className="p-3 bg-white border border-zinc-300 hover:border-zinc-500 text-zinc-700 transition-colors cursor-pointer"
            title="Lagu sebelumnya"
            aria-label="Lagu sebelumnya"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Tombol Putar/Jeda (Play/Pause) Kotak Tajam Pink Solid */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="p-4 sm:p-5 bg-[#ec4899] hover:bg-[#db2777] text-white border border-[#db2777] shadow-sm transition-colors cursor-pointer flex items-center justify-center"
            title={isPlaying ? 'Jeda pemutaran musik bersama' : 'Putar musik bersama'}
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Tombol Lewati Selanjutnya (Kotak Tajam) */}
          <button
            type="button"
            onClick={onSkipNext}
            className="p-3 bg-white border border-zinc-300 hover:border-zinc-500 text-zinc-700 transition-colors cursor-pointer"
            title="Lagu berikutnya"
            aria-label="Lagu berikutnya"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Sisi Kanan: Tombol Detak Cinta & Pengatur Volume Privat */}
        <div className="flex items-center gap-2.5 order-3">
          {/* Tombol Detak Cinta Kotak Tajam */}
          <button
            type="button"
            onClick={onSendHeart}
            className="p-2.5 bg-[#fdf2f6] hover:bg-[#fce7f3] border border-[#f9a8d4] text-[#ec4899] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Kirim detak cinta ke pasangan"
            aria-label="Kirim detak cinta"
          >
            <Heart className="w-4 h-4 fill-[#ec4899]" />
            <span className="text-xs font-bold hidden md:inline">Detak Cinta</span>
          </button>

          {/* Pengatur Volume Suara Privat (Kotak Tajam) */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#faf7f8] border border-zinc-300">
            <button
              type="button"
              onClick={handleVolumeToggle}
              className="text-zinc-600 hover:text-black transition-colors cursor-pointer"
              title={activeMuted ? 'Nyalakan suara' : 'Bisukan suara'}
              aria-label="Pengaturan suara"
            >
              {activeMuted || activeVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#e11d48]" />
              ) : activeVolume < 50 ? (
                <Volume1 className="w-4 h-4 text-zinc-700" />
              ) : (
                <Volume2 className="w-4 h-4 text-zinc-700" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={activeMuted ? 0 : activeVolume}
              onChange={handleVolumeChange}
              aria-label="Volume suara privat"
              className="w-16 sm:w-20 h-1.5 appearance-none cursor-pointer bg-zinc-300 accent-[#ec4899]"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
