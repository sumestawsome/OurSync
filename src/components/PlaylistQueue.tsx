import React, { useState } from 'react'
import type { Song } from '../types'
import { extractYouTubeId, getYouTubeThumbnail } from '../utils/youtube'
import {
  Search,
  Plus,
  Trash2,
  Play,
  Music2,
  Clock,
  Link2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react'

interface PlaylistQueueProps {
  queue: Song[]
  currentSongId?: string
  onPlaySong: (songId: string) => void
  onRemoveSong: (songId: string) => void
  onAddSong: (newSong: Omit<Song, 'id'>) => void
  onReorderQueue?: (newQueue: Song[]) => void
}

export const PlaylistQueue: React.FC<PlaylistQueueProps> = ({
  queue,
  currentSongId,
  onPlaySong,
  onRemoveSong,
  onAddSong,
  onReorderQueue,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const input = searchQuery.trim()
    const extractedId = extractYouTubeId(input)

    if (extractedId) {
      onAddSong({
        title: `YouTube Track (${extractedId.substring(0, 6)}...)`,
        artist: 'YouTube Video',
        duration: '03:45',
        durationSeconds: 225,
        thumbnail: getYouTubeThumbnail(extractedId),
        videoId: extractedId,
        url: input,
        addedBy: 'Kamu',
      })
    } else {
      onAddSong({
        title: input,
        artist: 'Pilihan Spesial',
        duration: '03:15',
        durationSeconds: 195,
        thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80',
        videoId: 'GxldQ9eX2wo',
        addedBy: 'Kamu',
      })
    }

    setSearchQuery('')
  }

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const extractedId = newUrl ? extractYouTubeId(newUrl) : null
    const videoId = extractedId || 'GxldQ9eX2wo'
    const thumbnail = extractedId
      ? getYouTubeThumbnail(extractedId)
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'

    onAddSong({
      title: newTitle.trim(),
      artist: newArtist.trim() || 'Artis Romantis',
      duration: '03:30',
      durationSeconds: 210,
      thumbnail,
      videoId,
      url: newUrl.trim() || undefined,
      addedBy: 'Kamu',
    })

    setNewTitle('')
    setNewArtist('')
    setNewUrl('')
    setShowAddForm(false)
  }

  // Pindahkan urutan lagu ke atas
  const handleMoveUp = (index: number) => {
    if (index <= 0 || !onReorderQueue) return
    const newQueue = [...queue]
    const temp = newQueue[index]
    newQueue[index] = newQueue[index - 1]
    newQueue[index - 1] = temp
    onReorderQueue(newQueue)
  }

  // Pindahkan urutan lagu ke bawah
  const handleMoveDown = (index: number) => {
    if (index >= queue.length - 1 || !onReorderQueue) return
    const newQueue = [...queue]
    const temp = newQueue[index]
    newQueue[index] = newQueue[index + 1]
    newQueue[index + 1] = temp
    onReorderQueue(newQueue)
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
              {queue.length} lagu &bull; Tarik atau klik panah untuk atur urutan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 bg-[#fdf2f6] border border-[#f9a8d4] text-[#ec4899] hover:bg-[#ec4899] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Tutup Form' : 'Tambah Lagu'}</span>
        </button>
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
            className="absolute right-1 px-3 py-1.5 bg-[#ec4899] hover:bg-[#db2777] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
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
              placeholder="Judul Lagu (Contoh: Lover)"
              className="w-full px-3.5 py-2 bg-white border border-zinc-300 text-[#1e1b1d] placeholder:text-zinc-400 focus:outline-none focus:border-[#ec4899]"
              required
            />
            <input
              type="text"
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              placeholder="Nama Artis (Contoh: Taylor Swift)"
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
            className="w-full py-2.5 bg-[#ec4899] hover:bg-[#db2777] text-white font-bold cursor-pointer transition-colors"
          >
            Masukkan ke Antrean
          </button>
        </form>
      )}

      {/* DAFTAR ANTREAN LAGU DENGAN DUKUNGAN REORDERING (DRAG & DROP + PANAH NAIK/TURUN) */}
      <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[380px] pr-1 flex-1">
        {filteredQueue.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-xs">
            Tidak ada lagu yang cocok dengan pencarian
          </div>
        ) : (
          filteredQueue.map((song, index) => {
            const isCurrent = song.id === currentSongId
            const isDragging = draggedIndex === index

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
                    title="Tahan dan geser untuk ubah urutan"
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

                {/* Tombol Reorder Cepat (Naik / Turun) & Aksi */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Tombol Geser Urutan Naik / Turun */}
                  {!searchQuery && (
                    <div className="flex flex-col border border-zinc-200 bg-zinc-50 mr-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-[#fdf2f6] text-zinc-500 hover:text-[#ec4899] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Pindahkan lagu ke atas"
                        aria-label="Pindah ke atas"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === queue.length - 1}
                        className="p-1 hover:bg-[#fdf2f6] text-zinc-500 hover:text-[#ec4899] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Pindahkan lagu ke bawah"
                        aria-label="Pindah ke bawah"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono hidden sm:flex mr-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{song.duration}</span>
                  </div>

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
