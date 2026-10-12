import React from 'react'
import { Music, Check, X, GitMerge, UserCheck } from 'lucide-react'
import type { Song } from '../types'

interface JoinerMergeChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  personalSongCount: number
  onRequestMerge: () => void
  onUseHostPlaylist: () => void
}

export const JoinerMergeChoiceModal: React.FC<JoinerMergeChoiceModalProps> = ({
  isOpen,
  onClose,
  personalSongCount,
  onRequestMerge,
  onUseHostPlaylist,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-md p-6 sm:p-7 bg-white border-2 border-zinc-900 shadow-xl text-[#1e1b1d]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="inline-flex p-3 mb-2 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899]">
            <GitMerge className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-heading tracking-tight text-[#1e1b1d]">
            Pilihan Playlist Ruang Dengar
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 font-sans">
            Kamu memiliki playlist pribadi berisi <span className="font-bold text-[#ec4899]">{personalSongCount} lagu</span>. Bagaimana kamu ingin mendengarkan musik bersama?
          </p>
        </div>

        <div className="space-y-3">
          {/* Tombol Minta Gabungkan */}
          <button
            type="button"
            onClick={() => {
              onRequestMerge()
              onClose()
            }}
            className="w-full py-3.5 px-4 bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#db2777] transition-colors cursor-pointer"
          >
            <GitMerge className="w-4 h-4" />
            <span>Minta Gabungkan Playlist Pribadi Saya</span>
          </button>

          {/* Tombol Gunakan Playlist Host */}
          <button
            type="button"
            onClick={() => {
              onUseHostPlaylist()
              onClose()
            }}
            className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-zinc-300 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Gunakan Playlist Milik Pemilik Ruangan (Host)</span>
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 text-center mt-4">
          Jika memilih gabung, pemilik ruangan akan menerima permintaan konfirmasi untuk menyetujui atau menolak.
        </p>
      </div>
    </div>
  )
}

interface HostApprovalModalProps {
  isOpen: boolean
  requesterName: string
  incomingSongs: Song[]
  onAccept: () => void
  onReject: () => void
}

export const HostApprovalModal: React.FC<HostApprovalModalProps> = ({
  isOpen,
  requesterName,
  incomingSongs,
  onAccept,
  onReject,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-md p-6 sm:p-7 bg-white border-2 border-zinc-900 shadow-xl text-[#1e1b1d]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="inline-flex p-3 mb-2 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899]">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-heading tracking-tight text-[#1e1b1d]">
            Permintaan Penggabungan Playlist
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 font-sans">
            <span className="font-bold text-zinc-900">{requesterName}</span> meminta izin untuk menggabungkan <span className="font-bold text-[#ec4899]">{incomingSongs.length} lagu</span> dari playlist pribadinya ke dalam antrean ruangan ini.
          </p>
        </div>

        {/* Preview Singkat Daftar Lagu */}
        <div className="mb-5 max-h-36 overflow-y-auto border border-zinc-200 bg-[#faf7f8] p-2 space-y-1.5 text-left">
          {incomingSongs.slice(0, 4).map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-xs text-zinc-700">
              <Music className="w-3 h-3 text-[#ec4899] shrink-0" />
              <span className="truncate font-medium">{s.title} &bull; {s.artist}</span>
            </div>
          ))}
          {incomingSongs.length > 4 && (
            <p className="text-[10px] text-zinc-500 font-semibold pl-5">
              +{incomingSongs.length - 4} lagu lainnya...
            </p>
          )}
        </div>

        <div className="flex gap-2.5">
          {/* Tombol Tolak */}
          <button
            type="button"
            onClick={onReject}
            className="flex-1 py-3 px-3 bg-white hover:bg-[#fff1f2] text-zinc-700 hover:text-[#e11d48] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-zinc-300 hover:border-[#fecdd3] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Tolak</span>
          </button>

          {/* Tombol Setujui */}
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 py-3 px-3 bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-[#db2777] transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Setujui &amp; Gabung</span>
          </button>
        </div>
      </div>
    </div>
  )
}
