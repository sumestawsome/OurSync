import React, { useState } from 'react'
import { X, KeyRound, ArrowRight } from 'lucide-react'
import { cleanRoomCode } from '../utils/roomCode'

interface JoinRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onJoin: (code: string) => void
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoin,
}) => {
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  // Smart-parser saat pengguna mengetik atau menempelkan teks
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Jika mengandung pola URL (slash, titik, titik dua, atau tanya), langsung isolasi kodenya
    if (raw.includes('/') || raw.includes(':') || raw.includes('.') || raw.includes('?')) {
      const parsed = cleanRoomCode(raw)
      setRoomCode(parsed)
    } else {
      // Input teks biasa: otomatis kapital (UPPERCASE) dan rapikan spasi
      setRoomCode(raw.toUpperCase().replace(/\s+/g, '-'))
    }
    setError('')
  }

  // Intersep event Paste untuk memproses URL lengkap tanpa terpotong
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    if (pastedText) {
      const parsed = cleanRoomCode(pastedText)
      setRoomCode(parsed)
      setError('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = cleanRoomCode(roomCode)
    if (!cleaned) {
      setError('Masukkan kode undangan ruangan terlebih dahulu')
      return
    }
    setError('')
    onJoin(cleaned)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-md p-6 sm:p-8 bg-white border-2 border-zinc-900 shadow-xl text-[#1e1b1d]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup Kotak Tajam */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Tutup modal"
          className="absolute top-5 right-5 p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black border border-zinc-300 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 mb-3 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899]">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold font-heading tracking-tight text-[#1e1b1d]">
            Gabung Ruang Dengar
          </h3>
          <p className="text-sm text-zinc-600 mt-1 font-sans">
            Masukkan kode undangan yang dibagikan oleh pasanganmu.
          </p>
        </div>

        {/* Form Gabung */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Kode Undangan
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={handleInputChange}
              onPaste={handlePaste}
              placeholder="CONTOH: LOVE-8506"
              className="w-full px-4 py-3 bg-[#fcf8f9] border-2 border-zinc-300 text-center text-lg font-heading tracking-widest text-[#1e1b1d] placeholder:text-zinc-400 focus:outline-none focus:border-[#ec4899] transition-all"
            />
            <p className="text-[11px] text-zinc-500 mt-2 text-center font-sans">
              💡 Bisa menempelkan (<span className="italic">paste</span>) kode saja atau tautan URL kamar lengkap.
            </p>
            {error && (
              <p className="text-xs text-[#e11d48] mt-2 text-center font-semibold">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 bg-[#ec4899] hover:bg-[#db2777] text-white font-bold flex items-center justify-center gap-2 border border-[#db2777] transition-colors cursor-pointer"
          >
            <span>Masuk ke Ruangan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Room Code Suggestion */}
        <div className="mt-6 pt-5 border-t border-zinc-200 text-center">
          <p className="text-xs text-zinc-500 mb-2">Ingin mencoba demo cepat?</p>
          <button
            type="button"
            onClick={() => {
              setRoomCode('LOVE-2026')
              setError('')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#ec4899] bg-[#fdf2f6] border border-[#f9a8d4] hover:bg-[#fce7f3] transition-colors cursor-pointer"
          >
            <span>Gunakan Kode: LOVE-2026</span>
          </button>
        </div>
      </div>
    </div>
  )
}
