import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeroSection } from '../components/HeroSection'
import { JoinRoomModal } from '../components/JoinRoomModal'
import { cleanRoomCode } from '../utils/roomCode'
import { useAuth } from '../context/AuthContext'
import { loadPersonalPlaylist } from '../utils/personalPlaylist'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { activeId, isGoogleUser } = useAuth()
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [pendingNickname, setPendingNickname] = useState('')

  const handleCreateRoom = async (nickname: string) => {
    localStorage.setItem('oursync_nickname', nickname)

    // 1. Bersihkan sisa cache host room sebelumnya di sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith('oursync_host_') || key.startsWith('oursync_room_'))) {
          sessionStorage.removeItem(key)
        }
      }
    } catch {
      // ignore
    }

    const randomCode = 'LOVE-' + Math.floor(1000 + Math.random() * 9000)
    sessionStorage.setItem('oursync_host_' + randomCode, 'true')

    // 2. Ambil template awal HANYA dari koleksi pribadi (loadPersonalPlaylist) milik ID akun aktif
    try {
      const personalSongs = await loadPersonalPlaylist(activeId, isGoogleUser)
      if (personalSongs && personalSongs.length > 0) {
        // Kloning salinan array sebagai antrean awal room baru (terpisah dari koleksi pribadi)
        const initialRoomQueue = personalSongs.map((song) => ({ ...song }))
        localStorage.setItem(`oursync_room_${randomCode}`, JSON.stringify({
          playlist: initialRoomQueue,
          currentSong: initialRoomQueue[0] || null,
          isPlaying: false,
          currentTime: 0,
          updatedAt: new Date().toISOString(),
        }))
      } else {
        localStorage.removeItem(`oursync_room_${randomCode}`)
      }
    } catch (err) {
      console.warn('Gagal menyiapkan antrean awal room dari koleksi pribadi:', err)
    }

    navigate(`/room/${randomCode}`)
  }

  const handleOpenJoinModal = (nickname: string) => {
    setPendingNickname(nickname)
    setIsJoinModalOpen(true)
  }

  const handleJoinWithCode = (code: string) => {
    const cleanedCode = cleanRoomCode(code)
    if (!cleanedCode) return

    if (pendingNickname) {
      localStorage.setItem('oursync_nickname', pendingNickname)
    }

    // Bersihkan sisa flag host room sebelumnya dari sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('oursync_host_')) {
          sessionStorage.removeItem(key)
        }
      }
    } catch {
      // ignore
    }

    setIsJoinModalOpen(false)
    sessionStorage.setItem('oursync_host_' + cleanedCode, 'false')
    navigate(`/room/${cleanedCode}`)
  }

  return (
    <main className="min-h-screen bg-[#fcf8f9] text-[#1e1b1d] relative">
      <HeroSection
        onCreateRoom={handleCreateRoom}
        onOpenJoinModal={handleOpenJoinModal}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinWithCode}
      />
    </main>
  )
}
