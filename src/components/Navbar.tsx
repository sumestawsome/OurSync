import React, { useState } from 'react'
import {
  Radio,
  Copy,
  Check,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  roomId: string
  partnerName?: string
  isPartnerOnline?: boolean
  onLeaveRoom: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  partnerName = 'Pasangan',
  isPartnerOnline = true,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout, activeName, activeAvatar } = useAuth()

  const handleCopy = async () => {
    if (!roomId) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(roomId)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = roomId
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    } catch {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = roomId
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      } catch (err) {
        console.warn('Gagal menyalin kode ruangan:', err)
      }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Logout khusus pengguna akun Google (memanggil signOut Supabase lalu kembali ke Landing Page)
  const handleGoogleLogout = async () => {
    await logout()
    onLeaveRoom()
  }

  // Logout / Keluar Ruangan khusus Guest (menghapus sesi nama lokal lalu kembali ke Landing Page)
  const handleGuestLeave = () => {
    localStorage.removeItem('oursync_nickname')
    sessionStorage.removeItem('oursync_host_' + roomId)
    onLeaveRoom()
  }

  return (
    <>
      {/* Toast Notifikasi Berhasil Salin Kode Ruangan */}
      {copied && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#1e1b1d] flex items-center gap-2">
          <div className="w-5 h-5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
          </div>
          <span className="text-xs font-bold font-sans">
            Kode ruangan berhasil disalin!
          </span>
          <span className="ml-1 px-1.5 py-0.5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] text-[11px] font-heading font-extrabold tracking-wider">
            {roomId}
          </span>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 bg-white border-b border-[#f0dbe2] shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo Brand (Sharp Square Icon & Pink Solid) */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ec4899] text-white">
              <Radio className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold font-heading tracking-tight text-[#1e1b1d]">
                OurSync
              </span>
              <span className="text-[10px] tracking-wider uppercase text-[#ec4899] font-bold -mt-1">
                Ruang Privat
              </span>
            </div>
          </div>

          {/* DESKTOP NAVIGATION ITEMS */}
          <div className="hidden md:flex items-center gap-3">
            {/* ID Ruangan & Tombol Salin Cepat (Kotak Bersudut Tajam) */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fdf2f6] border border-[#f9a8d4] text-xs">
              <span className="text-zinc-600 font-semibold">ID Ruangan:</span>
              <span className="font-heading font-bold text-[#ec4899] tracking-wider">
                {roomId}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="ml-1 p-1 hover:bg-[#fce7f3] text-zinc-600 hover:text-[#ec4899] transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-[#f9a8d4]"
                title="Salin kode ruangan"
                aria-label="Salin kode ruangan"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#ec4899]" />
                    <span className="text-[10px] text-zinc-600 font-medium">Salin</span>
                  </>
                )}
              </button>
            </div>

            {/* Indikator Status Pasangan (Informative Feedback: Emerald jika online, Abu-abu jika menunggu) */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 border transition-colors ${
                isPartnerOnline
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <span
                className={`inline-block w-2.5 h-2.5 ${
                  isPartnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                }`}
              ></span>
              <span
                className={`text-xs font-semibold ${
                  isPartnerOnline ? 'text-emerald-800' : 'text-zinc-600'
                }`}
              >
                {isPartnerOnline ? `Online bersama ${partnerName}` : 'Menunggu pasangan...'}
              </span>
            </div>

            {/* AREA PROFIL & LOGOUT CONDITIONAL RENDERING (HANYA 1 TOMBOL LOGOUT DI SISI KANAN) */}
            {user ? (
              /* Pengguna Terautentikasi Google: Profil (Foto + Nama) + 1 Tombol Logout Khusus Akun Google */
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-zinc-200">
                {activeAvatar ? (
                  <img
                    src={activeAvatar}
                    alt={activeName}
                    className="w-6 h-6 object-cover border border-zinc-300"
                  />
                ) : (
                  <div className="w-6 h-6 bg-[#fdf2f6] text-[#ec4899] flex items-center justify-center font-bold text-xs border border-[#f9a8d4]">
                    {activeName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-zinc-800 truncate max-w-[120px]" title={activeName}>
                  {activeName}
                </span>
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="p-1 hover:bg-[#fff1f2] text-zinc-400 hover:text-[#e11d48] border border-transparent hover:border-[#fecdd3] transition-colors cursor-pointer ml-1"
                  title="Logout Akun Google"
                  aria-label="Logout Akun Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Pengguna Guest (Tanpa Akun Google): Sembunyikan Profil Google, Tampilkan HANYA 1 Tombol Logout/Leave Room */
              <button
                type="button"
                onClick={handleGuestLeave}
                className="p-2 bg-white border border-zinc-300 hover:border-[#e11d48] text-zinc-600 hover:text-[#e11d48] hover:bg-[#fff1f2] transition-colors cursor-pointer flex items-center justify-center"
                title="Keluar dari ruangan"
                aria-label="Keluar ruangan"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* MOBILE BUTTONS */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] cursor-pointer"
              aria-label="Salin kode ruangan"
              title="Salin kode ruangan"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-white border border-zinc-300 text-zinc-700 cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER MENU (Sharp Edges, Light Mode) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/30 backdrop-blur-xs flex justify-end">
          <div 
            className="w-4/5 max-w-xs h-full bg-white border-l-2 border-zinc-900 p-6 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#ec4899] text-white">
                    <Radio className="w-4 h-4" />
                  </div>
                  <span className="font-heading font-bold text-[#1e1b1d] text-lg">OurSync</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Akun Pengguna Google di Mobile (Hanya Tampil Jika Login Google) */}
              {user && (
                <div className="p-3 bg-zinc-50 border border-zinc-200">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-bold">
                    Akun Terhubung (Google)
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {activeAvatar ? (
                        <img
                          src={activeAvatar}
                          alt={activeName}
                          className="w-8 h-8 object-cover border border-zinc-300 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-[#fdf2f6] text-[#ec4899] flex items-center justify-center font-bold text-sm border border-[#f9a8d4] shrink-0">
                          {activeName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">{activeName}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleGoogleLogout()
                      }}
                      className="p-1.5 text-zinc-500 hover:text-[#e11d48] hover:bg-[#fff1f2] border border-transparent hover:border-[#fecdd3] transition-colors cursor-pointer"
                      title="Logout Akun Google"
                      aria-label="Logout Akun Google"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Status Pasangan (Mobile: Emerald jika online, Abu-abu jika menunggu) */}
              <div
                className={`p-4 border transition-colors ${
                  isPartnerOnline
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <p
                  className={`text-[11px] uppercase tracking-wider mb-1.5 font-bold ${
                    isPartnerOnline ? 'text-emerald-800' : 'text-zinc-500'
                  }`}
                >
                  Status Terhubung
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 inline-block ${
                      isPartnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                    }`}
                  ></span>
                  <div>
                    <p className="text-sm font-bold text-[#1e1b1d]">
                      {isPartnerOnline ? partnerName : 'Belum Terhubung'}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        isPartnerOnline ? 'text-emerald-700' : 'text-zinc-500'
                      }`}
                    >
                      {isPartnerOnline ? `Online bersama ${partnerName}` : 'Menunggu pasangan...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Room ID & Tombol Salin */}
              <div className="p-4 bg-[#fdf2f6] border border-[#f9a8d4]">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">
                  ID Ruangan
                </p>
                <p className="text-base font-bold font-heading text-[#ec4899] tracking-wider mb-3">
                  {roomId}
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full py-2.5 px-4 bg-[#ec4899] text-white hover:bg-[#db2777] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Kode Ruangan Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Kode Ruangan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tombol Keluar Ruangan Khusus Pengguna Guest */}
            {!user && (
              <div className="pt-6 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleGuestLeave()
                  }}
                  className="w-full py-3 px-4 bg-white border-2 border-zinc-300 text-zinc-700 hover:border-[#e11d48] hover:text-[#e11d48] text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Ruangan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
