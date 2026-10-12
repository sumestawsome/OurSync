import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeroSection } from '../components/HeroSection'
import { JoinRoomModal } from '../components/JoinRoomModal'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [pendingNickname, setPendingNickname] = useState('')

  const handleCreateRoom = (nickname: string) => {
    localStorage.setItem('oursync_nickname', nickname)
    const randomCode = 'LOVE-' + Math.floor(1000 + Math.random() * 9000)
    navigate(`/room/${randomCode}`)
  }

  const handleOpenJoinModal = (nickname: string) => {
    setPendingNickname(nickname)
    setIsJoinModalOpen(true)
  }

  const handleJoinWithCode = (code: string) => {
    if (pendingNickname) {
      localStorage.setItem('oursync_nickname', pendingNickname)
    }
    setIsJoinModalOpen(false)
    navigate(`/room/${code}`)
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
