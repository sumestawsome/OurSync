import React, { useState, useEffect } from 'react'
import { Sparkles, Plus, LogIn, ShieldCheck, Zap, Radio, HeartHandshake, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface HeroSectionProps {
  onCreateRoom: (nickname: string) => void
  onOpenJoinModal: (nickname: string) => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCreateRoom,
  onOpenJoinModal,
}) => {
  const { user, loginWithGoogle, logout, activeName, activeAvatar } = useAuth()
  const [nickname, setNickname] = useState(activeName || '')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (activeName) {
      setNickname(activeName)
    }
  }, [activeName])

  const handleCreate = () => {
    if (!nickname.trim()) {
      setErrorMsg('Masukkan nama panggilan Anda terlebih dahulu')
      return
    }
    setErrorMsg('')
    onCreateRoom(nickname.trim())
  }

  const handleJoin = () => {
    if (!nickname.trim()) {
      setErrorMsg('Masukkan nama panggilan Anda terlebih dahulu')
      return
    }
    setErrorMsg('')
    onOpenJoinModal(nickname.trim())
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-[#fcf8f9]">
      {/* Decorative Brand Top Badge (Sharp Rectangular Box) */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 mb-8 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] text-xs sm:text-sm font-semibold tracking-wide">
        <HeartHandshake className="w-4 h-4 text-[#ec4899]" />
        <span>Sinkronisasi Audio Khusus Pasangan &bull; Real-Time</span>
        <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
      </div>

      {/* Main Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight text-[#1e1b1d] leading-[1.12]">
          Dengarkan Musik Bersama,{' '}
          <span className="text-[#ec4899]">
            Lebih Dekat Dari Jarak
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-zinc-600 font-sans max-w-2xl mx-auto font-normal leading-relaxed">
          Nikmati setiap ketukan lagu favorit bersama pasanganmu secara sinkron detik demi detik. Tanpa jeda, tanpa ribet, terasa seperti berbagi satu pasang earphone yang sama.
        </p>
      </div>

      {/* Formulir Setup Sesi (Sharp Rectangle Card) */}
      <div className="w-full max-w-md mx-auto mt-10 p-6 sm:p-8 bg-white border border-[#f0dbe2] shadow-sm relative">
        {/* Google Auth Status / Action Banner */}
        <div className="mb-5 pb-4 border-b border-zinc-200">
          {user ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeAvatar ? (
                  <img
                    src={activeAvatar}
                    alt={activeName}
                    className="w-8 h-8 object-cover border border-emerald-300 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-300 shrink-0">
                    {activeName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 truncate">
                    {activeName}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Terhubung via Google Auth
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-zinc-500 hover:text-[#e11d48] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Keluar akun Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px]">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full py-2.5 px-3 bg-white hover:bg-[#fdf2f6] border border-zinc-300 hover:border-[#ec4899] text-xs font-bold text-zinc-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#ec4899]" />
              <span>Masuk dengan Google (Simpan Playlist &amp; Chat)</span>
            </button>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 text-left">
              Nama Panggilan Kamu
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              placeholder="Misal: Sayang, Reza, atau Putri"
              className="w-full px-4 py-3.5 bg-[#fcf8f9] border border-zinc-300 text-[#1e1b1d] placeholder:text-zinc-400 font-sans text-base focus:outline-none focus:border-[#ec4899] transition-colors"
            />
            {errorMsg && (
              <p className="text-xs text-[#e11d48] mt-2 font-semibold text-left">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Tombol Aksi Utama (Sharp Edges, Solid Pink, No Gradient/Glow) */}
          <div className="space-y-3 pt-1">
            {/* Tombol Buat Room Baru */}
            <button
              type="button"
              onClick={handleCreate}
              className="w-full py-3.5 px-6 bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer group"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Room Baru</span>
            </button>

            {/* Tombol Sekunder Gabung Room */}
            <button
              type="button"
              onClick={handleJoin}
              className="w-full py-3 px-6 border-2 border-[#ec4899] text-[#ec4899] hover:bg-[#fdf2f6] font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#ec4899]" />
              <span>Gabung Room dengan Kode</span>
            </button>
          </div>
        </div>

        {/* Quick Helper */}
        <p className="text-xs text-zinc-500 text-center mt-4">
          Tautan kamar dapat langsung dibagikan ke WhatsApp atau Telegram pasanganmu.
        </p>
      </div>

      {/* Feature Highlights Grid (Sharp Rectangles) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12 w-full">
        <div className="p-5 bg-white border border-[#f0dbe2] shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-heading text-[#1e1b1d]">Sinkronisasi Presisi</h4>
            <p className="text-xs text-zinc-600 mt-1 font-sans leading-relaxed">
              Jeda pemutaran di bawah 50ms untuk pengalaman mendengarkan yang mulus.
            </p>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#f0dbe2] shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-heading text-[#1e1b1d]">Antrean Kolaboratif</h4>
            <p className="text-xs text-zinc-600 mt-1 font-sans leading-relaxed">
              Kalian berdua bebas mencari dan memasukkan lagu cinta ke daftar putar.
            </p>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#f0dbe2] shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-heading text-[#1e1b1d]">Privat &amp; Intim</h4>
            <p className="text-xs text-zinc-600 mt-1 font-sans leading-relaxed">
              Ruang berdua tanpa gangguan publik dan dilengkapi obrolan khusus.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
