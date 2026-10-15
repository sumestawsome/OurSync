import React, { useState } from 'react'
import type { Song } from '../types'
import { extractYouTubeId, getYouTubeThumbnail, fetchYouTubeVideoInfo } from '../utils/youtube'
import {
  Search,
  Plus,
  Trash2,
  Play,
  Music2,
  Clock,
  Link2,
  GripVertical,
  Loader2,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
} from 'lucide-react'

interface PlaylistQueueProps {
  queue: Song[]
  personalPlaylist?: Song[]
  currentSongId?: string
  onPlaySong: (songId: string) => void
  onRemoveSong: (songId: string) => void
  onAddSong: (newSong: Omit<Song, 'id'>) => void
  onReorderQueue?: (newQueue: Song[]) => void
  onImportPersonalPlaylist?: () => void
  onSaveToPersonalPlaylist?: (song: Song) => void
}

export const PlaylistQueue: React.FC<PlaylistQueueProps> = ({
  queue,
  personalPlaylist = [],
  currentSongId,
  onPlaySong,
  onRemoveSong,
  onAddSong,
  onReorderQueue,
  onImportPersonalPlaylist,
  onSaveToPersonalPlaylist,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || isSubmitting) return

    const input = searchQuery.trim()
    const extractedId = extractYouTubeId(input)
    setIsSubmitting(true)

    try {
      if (extractedId) {
        const info = await fetchYouTubeVideoInfo(extractedId)
        onAddSong({
          title: info.title || `YouTube Track (${extractedId.substring(0, 6)}...)`,
          artist: info.author || 'YouTube Video',
          duration: '--:--',
          durationSeconds: 0,
          thumbnail: getYouTubeThumbnail(extractedId),
          videoId: extractedId,
          url: input,
          addedBy: 'Kamu',
        })
      } else {
        onAddSong({
          title: input,
          artist: 'Pilihan Spesial',
          duration: '--:--',
          durationSeconds: 0,
          thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80',
          videoId: 'GxldQ9eX2wo',
          addedBy: 'Kamu',
        })
      }
    } finally {
      setIsSubmitting(false)
      setSearchQuery('')
    }
  }

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || isSubmitting) return

    const extractedId = newUrl ? extractYouTubeId(newUrl) : null
    const videoId = extractedId || 'GxldQ9eX2wo'
    const thumbnail = extractedId
      ? getYouTubeThumbnail(extractedId)
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'

    setIsSubmitting(true)
    try {
      let finalArtist = newArtist.trim()
      let finalTitle = newTitle.trim()

      if (extractedId && (!finalArtist || finalTitle.length < 3)) {
        const info = await fetchYouTubeVideoInfo(extractedId)
        if (info.author && !finalArtist) finalArtist = info.author
        if (info.title && finalTitle.length < 3) finalTitle = info.title
      }

      onAddSong({
        title: finalTitle,
        artist: finalArtist || 'Artis Musik',
        duration: '--:--',
        durationSeconds: 0,
        thumbnail,
        videoId,
        url: newUrl.trim() || undefined,
        addedBy: 'Kamu',
      })

      setNewTitle('')
      setNewArtist('')
      setNewUrl('')
      setShowAddForm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex || !onReorderQueue) {
      setDraggedIndex(null)
      return
    }

    const newQueue = [...queue]
    const [movedItem] = newQueue.splice(draggedIndex, 1)
    newQueue.splice(dropIndex, 0, movedItem)
    setDraggedIndex(null)
    onReorderQueue(newQueue)
  }

  const filteredQueue = queue.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.artist.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full bg-white border border-[#f0dbe2] shadow-sm p-5 sm:p-6 flex flex-col h-full">
      {/* Header Antrean Lagu */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899]">
            <Music2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-heading text-[#1e1b1d]">
              Antrean Bersama
            </h3>
            <p className="text-xs text-zinc-500 font-sans">
              {queue.length} lagu &bull; Tarik ikon geser untuk mengatur urutan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {personalPlaylist.length > 0 && onImportPersonalPlaylist && (
            <button
              type="button"
              onClick={onImportPersonalPlaylist}
              className="px-3 py-1.5 bg-white hover:bg-[#fdf2f6] border border-zinc-300 hover:border-[#f9a8d4] text-zinc-700 hover:text-[#ec4899] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Muat lagu dari koleksi playlist pribadi akun ke antrean ruangan saat ini"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#ec4899]" />
              <span className="hidden sm:inline">Koleksi Pribadi</span>
              <span className="font-bold text-[#ec4899]">({personalPlaylist.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] hover:bg-[#ec4899] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Tutup Form' : 'Tambah Lagu'}</span>
          </button>
        </div>
      </div>

      {/* Kotak Pencarian Tautan/Judul Lagu Bersudut Siku Tajam */}
      <form onSubmit={handleSearchSubmit} className="mt-4 relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lagu atau tempel URL YouTube..."
            className="w-full pl-10 pr-24 py-2.5 bg-[#fcf8f9] border border-zinc-300 text-[#1e1b1d] placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none focus:border-[#ec4899] font-sans"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="absolute right-1 px-3 py-1.5 bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            <span>Tambah</span>
          </button>
        </div>
      </form>

      {/* Form Tambah Manual Kotak Tajam */}
      {showAddForm && (
        <form
          onSubmit={handleManualAdd}
          className="mt-3 p-4 bg-[#faf7f8] border border-zinc-200 space-y-3 text-xs"
        >
          <p className="font-bold text-[#ec4899] font-heading">
            Tambah Tautan YouTube atau Musik Baru
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Judul Lagu (Contoh: Toxic)"
              className="w-full px-3.5 py-2 bg-white border border-zinc-300 text-[#1e1b1d] placeholder:text-zinc-400 focus:outline-none focus:border-[#ec4899]"
              required
            />
            <input
              type="text"
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              placeholder="Nama Artis (Contoh: Britney Spears)"
              className="w-full px-3.5 py-2 bg-white border border-zinc-300 text-[#1e1b1d] placeholder:text-zinc-400 focus:outline-none focus:border-[#ec4899]"
            />
            <div className="relative">
              <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Tautan YouTube: https://www.youtube.com/watch?v=..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 text-[#1e1b1d] placeholder:text-zinc-400 focus:outline-none focus:border-[#ec4899]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-50 text-white font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Masukkan ke Antrean</span>
          </button>
        </form>
      )}

      {/* DAFTAR ANTREAN LAGU DENGAN DUKUNGAN REORDERING (DRAG & DROP) */}
      <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[380px] pr-1 flex-1">
        {filteredQueue.length === 0 ? (
          <div className="text-center py-8 px-4 text-zinc-400 text-xs">
            {queue.length === 0 ? (
              <div className="space-y-3">
                <Music2 className="w-8 h-8 mx-auto text-zinc-300" />
                <div>
                  <p className="font-semibold text-zinc-700 text-sm">Antrean Ruangan Masih Kosong</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Cari atau tempel tautan YouTube di atas untuk menambahkan musik ke ruangan ini.
                  </p>
                </div>
                {personalPlaylist.length > 0 && onImportPersonalPlaylist && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onImportPersonalPlaylist}
                      className="px-4 py-2 bg-[#fdf2f6] hover:bg-[#ec4899] text-[#ec4899] hover:text-white border border-[#f9a8d4] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                      <span>Impor {personalPlaylist.length} Lagu dari Koleksi Pribadi Saya</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              'Tidak ada lagu yang cocok dengan pencarian'
            )}
          </div>
        ) : (
          filteredQueue.map((song, index) => {
            const isCurrent = song.id === currentSongId
            const isDragging = draggedIndex === index
            const isSavedInPersonal = personalPlaylist.some(
              (p) => p.id === song.id || (p.videoId && p.videoId === song.videoId) || p.title === song.title
            )

            return (
              <div
                key={song.id}
                draggable={!searchQuery}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`p-3 flex items-center justify-between gap-3 border transition-all ${
                  isDragging
                    ? 'opacity-40 border-dashed border-[#ec4899]'
                    : isCurrent
                    ? 'bg-[#fdf2f6] border-[#f9a8d4]'
                    : 'bg-white border-zinc-200 hover:border-[#f9a8d4] hover:bg-[#fffbfe]'
                }`}
              >
                {/* Drag Handle & Info Lagu & Thumbnail */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Grip Handle Drag & Drop */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-[#ec4899] transition-colors p-0.5"
                    title="Tahan dan geser untuk ubah urutan antrean"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="relative w-11 h-11 shrink-0 border border-zinc-300 overflow-hidden bg-zinc-100">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-[#ec4899]/30 flex items-center justify-center">
                        <span className="w-2 h-2 bg-white inline-block" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold truncate font-heading ${
                          isCurrent ? 'text-[#ec4899]' : 'text-[#1e1b1d]'
                        }`}
                      >
                        {song.title}
                      </h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-[#ec4899] text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                          Memutar
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate font-sans">
                      {song.artist} &bull; <span className="text-zinc-600 font-medium">{song.addedBy}</span>
                    </p>
                  </div>
                </div>

                {/* Info Durasi Akurat & Tombol Aksi */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono hidden sm:flex mr-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{song.duration || '--:--'}</span>
                  </div>

                  {/* Tombol Simpan ke Playlist Pribadi */}
                  {onSaveToPersonalPlaylist && (
                    <button
                      type="button"
                      onClick={() => onSaveToPersonalPlaylist(song)}
                      className={`p-1.5 border transition-colors cursor-pointer ${
                        isSavedInPersonal
                          ? 'bg-[#fdf2f6] border-[#f9a8d4] text-[#ec4899]'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 border-zinc-200'
                      }`}
                      title={
                        isSavedInPersonal
                          ? 'Tersimpan di Playlist Pribadi (Klik untuk hapus)'
                          : 'Simpan ke Playlist Pribadi Akun'
                      }
                      aria-label="Simpan ke Playlist Pribadi"
                    >
                      {isSavedInPersonal ? (
                        <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <BookmarkPlus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Tombol Putar */}
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => onPlaySong(song.id)}
                      className="p-1.5 bg-zinc-100 hover:bg-[#ec4899] hover:text-white text-zinc-600 border border-zinc-200 transition-colors cursor-pointer"
                      title="Putar lagu ini sekarang"
                      aria-label="Putar lagu ini"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}

                  {/* Tombol Hapus */}
                  <button
                    type="button"
                    onClick={() => onRemoveSong(song.id)}
                    className="p-1.5 bg-zinc-100 hover:bg-[#fff1f2] hover:border-[#fecdd3] text-zinc-500 hover:text-[#e11d48] border border-zinc-200 transition-colors cursor-pointer"
                    title="Hapus dari antrean"
                    aria-label="Hapus dari antrean"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
