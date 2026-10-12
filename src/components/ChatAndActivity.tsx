import React, { useState, useRef, useEffect } from 'react'
import type { ChatMessage, ActivityLog } from '../types'
import {
  MessageCircle,
  Activity,
  Send,
  Heart,
  Sparkles,
  Music,
  Play,
  Pause,
  UserCheck,
} from 'lucide-react'

interface ChatAndActivityProps {
  messages: ChatMessage[]
  activities: ActivityLog[]
  onSendMessage: (text: string) => void
  onSendHeart: () => void
}

export const ChatAndActivity: React.FC<ChatAndActivityProps> = ({
  messages,
  activities,
  onSendMessage,
  onSendHeart,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'activity'>('chat')
  const [inputVal, setInputVal] = useState('')
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, activeTab])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    onSendMessage(inputVal.trim())
    setInputVal('')
  }

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'play':
        return <Play className="w-3 h-3 text-emerald-600" />
      case 'pause':
        return <Pause className="w-3 h-3 text-amber-600" />
      case 'add_song':
        return <Music className="w-3 h-3 text-[#ec4899]" />
      case 'reaction':
        return <Heart className="w-3 h-3 text-[#ec4899] fill-[#ec4899]" />
      case 'join':
        return <UserCheck className="w-3 h-3 text-blue-600" />
      default:
        return <Sparkles className="w-3 h-3 text-[#ec4899]" />
    }
  }

  return (
    <div className="w-full bg-white border border-[#f0dbe2] shadow-sm p-5 flex flex-col h-[520px]">
      {/* Tab Switch: Kotak Bersudut Siku 90 Derajat */}
      <div className="flex items-center gap-1.5 p-1 bg-[#faf7f8] border border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
            activeTab === 'chat'
              ? 'bg-[#ec4899] text-white border-[#db2777]'
              : 'bg-white text-zinc-600 border-zinc-200 hover:text-black'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Obrolan Pasangan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
            activeTab === 'activity'
              ? 'bg-[#ec4899] text-white border-[#db2777]'
              : 'bg-white text-zinc-600 border-zinc-200 hover:text-black'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Aktivitas Musik</span>
        </button>
      </div>

      {/* ISI KONTEN */}
      {activeTab === 'chat' ? (
        <div className="flex flex-col flex-1 min-h-0 mt-4">
          {/* Scrollable Chat Bubbles (Strictly Sharp Rectangles, Soft Pink & Clean White) */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto space-y-3.5 pr-1.5"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.isSelf ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-0.5">
                  <span className="text-[10px] font-bold text-zinc-500">
                    {msg.sender}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {/* GELEMBUNG PESAN KOTAK BERSUDUT TAJAM (NO ROUNDED) */}
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed border ${
                    msg.isSelf
                      ? 'bg-[#fdf2f6] border-[#f9a8d4] text-[#1e1b1d]'
                      : 'bg-[#f8fafc] border-zinc-200 text-[#1e1b1d]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Field dengan Sudut Siku Tajam */}
          <form onSubmit={handleSend} className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2">
            <button
              type="button"
              onClick={onSendHeart}
              className="p-2.5 bg-[#fdf2f6] hover:bg-[#fce7f3] border border-[#f9a8d4] text-[#ec4899] transition-colors shrink-0 cursor-pointer"
              title="Kirim detak cinta instan"
              aria-label="Kirim detak cinta"
            >
              <Heart className="w-4 h-4 fill-[#ec4899]" />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ketik pesan untuk pasanganmu..."
                className="w-full px-3.5 py-2.5 bg-[#fcf8f9] border border-zinc-300 text-[#1e1b1d] placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none focus:border-[#ec4899] font-sans"
              />
            </div>

            <button
              type="submit"
              className="p-2.5 bg-[#ec4899] hover:bg-[#db2777] text-white border border-[#db2777] transition-colors shrink-0 cursor-pointer"
              title="Kirim pesan"
              aria-label="Kirim pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* PANEL AKTIVITAS REAL-TIME (Sharp Light Mode Cards) */
        <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
            Riwayat Interaksi Ruang Bersama
          </p>
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3 bg-[#faf7f8] border border-zinc-200 flex items-start gap-2.5"
            >
              <div className="p-1.5 bg-white border border-zinc-200 shrink-0 mt-0.5">
                {getActivityIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#1e1b1d] font-sans leading-snug">
                  {act.text}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#ec4899] font-bold">
                    {act.user}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {act.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
