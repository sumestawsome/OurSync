import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { MusicPlayer } from '../components/MusicPlayer'
import { ControlPanel } from '../components/ControlPanel'
import { PlaylistQueue } from '../components/PlaylistQueue'
import { ChatAndActivity } from '../components/ChatAndActivity'
import { FloatingHearts } from '../components/FloatingHearts'
import type { HeartParticle } from '../components/FloatingHearts'
import {
  initialPlaylist,
  initialMessages,
  initialActivities,
} from '../data/mockData'
import type { Song, ChatMessage, ActivityLog, BroadcastEvent } from '../types'
import { supabase } from '../lib/supabaseClient'

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  // State antrean & pemutar
  const [queue, setQueue] = useState<Song[]>(initialPlaylist)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0)
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(177)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)

  // State chat & aktivitas & partikel afeksi
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities)
  const [hearts, setHearts] = useState<HeartParticle[]>([])

  // State kehadiran pasangan (Presence)
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const [partnerName, setPartnerName] = useState('Pasangan')

  // Ref pemain YouTube dan Supabase channel
  const playerRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const clientId = useRef<string>('client-' + Math.random().toString(36).substring(2, 9)).current

  const currentSong = queue[currentSongIndex] || null
  const storedNickname = localStorage.getItem('oursync_nickname') || 'Kamu'

  // Helper untuk mendapatkan instance YouTube player secara andal
  const getYTPlayer = () => {
    if (!playerRef.current) return null
    return playerRef.current.internalPlayer || playerRef.current
  }

  // Helper untuk menyimpan / sinkronisasi state room ke database Supabase (tabel rooms)
  const saveRoomState = async (updates: {
    playlist?: Song[]
    currentSong?: Song | null
    isPlaying?: boolean
    currentTime?: number
  }) => {
    if (!roomId) return
    try {
      const activeQueue = updates.playlist ?? queue
      const activeSong = updates.currentSong !== undefined ? updates.currentSong : currentSong
      const activePlaying = updates.isPlaying ?? isPlaying
      const activeTime = updates.currentTime ?? currentTimeSeconds

      await supabase.from('rooms').upsert({
        room_id: roomId,
        playlist: activeQueue,
        current_song: activeSong,
        is_playing: activePlaying,
        current_time: activeTime,
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('Gagal menyimpan status room ke database Supabase:', err)
    }
  }

  // 1. FETCH PERSISTENSI DATA ROOM DARI TABEL SUPABASE (ROOMS)
  useEffect(() => {
    if (!roomId) return

    const loadRoomData = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_id', roomId)
          .maybeSingle()

        if (data && !error) {
          if (Array.isArray(data.playlist) && data.playlist.length > 0) {
            setQueue(data.playlist)
            if (data.current_song) {
              const idx = data.playlist.findIndex((s: Song) => s.id === data.current_song.id)
              if (idx !== -1) {
                setCurrentSongIndex(idx)
              }
            }
          }
          if (typeof data.current_time === 'number') {
            setCurrentTimeSeconds(Math.floor(data.current_time))
          }
        } else {
          // Inisialisasi awal jika room belum ada di database
          await supabase.from('rooms').upsert({
            room_id: roomId,
            playlist: initialPlaylist,
            current_song: initialPlaylist[0],
            is_playing: false,
            current_time: 0,
            updated_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.warn('Info persistensi room:', err)
      }
    }

    loadRoomData()
  }, [roomId])

  // 2. SUPABASE REALTIME CHANNEL (BROADCAST & PRESENCE)
  useEffect(() => {
    if (!roomId) return

    const channelName = `room:${roomId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: clientId },
      },
    })

    channelRef.current = channel

    // Handler Presence: Status Pasangan Online/Offline
    const updatePresenceState = () => {
      const state = channel.presenceState()
      const presences = Object.entries(state)
      const partnerPresences = presences.filter(([key]) => key !== clientId)

      if (partnerPresences.length > 0) {
        setIsPartnerOnline(true)
        const firstPartner = partnerPresences[0][1] as any[]
        if (firstPartner && firstPartner.length > 0 && firstPartner[0].user) {
          setPartnerName(firstPartner[0].user)
        }
      } else {
        setIsPartnerOnline(false)
      }
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        updatePresenceState()
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        updatePresenceState()
        const user = (newPresences as any[])[0]?.user || 'Pasangan'
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        setActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            type: 'join',
            text: `${user} baru saja terhubung ke ruangan`,
            time: timeStr,
            user,
          },
          ...prev,
        ])
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        updatePresenceState()
        const user = (leftPresences as any[])[0]?.user || 'Pasangan'
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        setActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            type: 'pause',
            text: `${user} meninggalkan ruangan`,
            time: timeStr,
            user,
          },
          ...prev,
        ])
      })
      // Handler Broadcast Events dari Pasangan
      .on('broadcast', { event: 'music_sync' }, ({ payload }: { payload: BroadcastEvent }) => {
        handleIncomingBroadcast(payload)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user: storedNickname,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId, clientId, storedNickname])

  // 3. LOGIKA MENANGANI EVENT BROADCAST YANG DITERIMA DARI PASANGAN
  const handleIncomingBroadcast = (event: BroadcastEvent) => {
    const player = getYTPlayer()

    switch (event.type) {
      case 'PLAYER_PLAY': {
        const { currentTime, timestamp } = event.payload
        const latency = Math.max(0, (Date.now() - timestamp) / 1000)
        const targetTime = currentTime + latency

        if (player) {
          try {
            if (typeof player.seekTo === 'function') player.seekTo(targetTime, true)
            if (typeof player.playVideo === 'function') player.playVideo()
          } catch (err) {
            console.error('Gagal memutar video lokal:', err)
          }
        }
        setIsPlaying(true)
        setCurrentTimeSeconds(Math.floor(targetTime))

        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        setActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            type: 'play',
            text: `${partnerName} memulai pemutaran musik`,
            time: timeStr,
            user: partnerName,
          },
          ...prev,
        ])
        break
      }

      case 'PLAYER_PAUSE': {
        const { currentTime } = event.payload
        if (player) {
          try {
            if (typeof player.seekTo === 'function') player.seekTo(currentTime, true)
            if (typeof player.pauseVideo === 'function') player.pauseVideo()
          } catch (err) {
            console.error('Gagal menjeda video lokal:', err)
          }
        }
        setIsPlaying(false)
        setCurrentTimeSeconds(Math.floor(currentTime))

        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        setActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            type: 'pause',
            text: `${partnerName} menjeda pemutaran musik`,
            time: timeStr,
            user: partnerName,
          },
          ...prev,
        ])
        break
      }

      case 'PLAYER_SEEK': {
        const { newTime } = event.payload
        if (player && typeof player.seekTo === 'function') {
          try {
            player.seekTo(newTime, true)
          } catch (err) {
            console.error('Gagal seek video lokal:', err)
          }
        }
        setCurrentTimeSeconds(Math.floor(newTime))
        break
      }

      case 'CHANGE_SONG': {
        const { songId, shouldPlay } = event.payload
        setQueue((currentQueue) => {
          const idx = currentQueue.findIndex((s) => s.id === songId)
          if (idx !== -1) {
            setCurrentSongIndex(idx)
            setCurrentTimeSeconds(0)
            if (shouldPlay) {
              setIsPlaying(true)
              setTimeout(() => {
                const p = getYTPlayer()
                if (p) {
                  try {
                    if (typeof p.seekTo === 'function') p.seekTo(0, true)
                    if (typeof p.playVideo === 'function') p.playVideo()
                  } catch (e) {
                    // ignore
                  }
                }
              }, 400)
            }
          }
          return currentQueue
        })
        break
      }

      case 'ADD_QUEUE': {
        const { song } = event.payload
        setQueue((prev) => {
          const updated = [...prev, song]
          return updated
        })
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        setActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            type: 'add_song',
            text: `${song.addedBy} menambahkan "${song.title}" ke antrean`,
            time: timeStr,
            user: song.addedBy,
          },
          ...prev,
        ])
        break
      }

      case 'REMOVE_QUEUE': {
        const { songId } = event.payload
        setQueue((prev) => prev.filter((s) => s.id !== songId))
        break
      }

      case 'REORDER_QUEUE': {
        const { queue: newQueue } = event.payload
        setQueue(newQueue)
        if (currentSong) {
          const newIdx = newQueue.findIndex((s) => s.id === currentSong.id)
          if (newIdx !== -1) {
            setCurrentSongIndex(newIdx)
          }
        }
        break
      }

      case 'SEND_LOVE': {
        triggerFloatingHearts()
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        setActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            type: 'reaction',
            text: `${event.payload.sender} mengirimkan detak cinta di layar!`,
            time: timeStr,
            user: event.payload.sender,
          },
          ...prev,
        ])
        break
      }

      case 'CHAT_MESSAGE': {
        const { sender, message, timestamp } = event.payload
        const date = new Date(timestamp || Date.now())
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        const incomingMsg: ChatMessage = {
          id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          sender,
          text: message,
          timestamp: timeStr,
          isSelf: false,
        }
        setMessages((prev) => [...prev, incomingMsg])
        break
      }
    }
  }

  // 4. BROADCAST HELPER UNTUK MENGIRIM EVENT KE PASANGAN
  const sendBroadcast = (event: BroadcastEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'music_sync',
        payload: event,
      })
    }
  }

  // 5. FITUR AUTO-ADVANCE PLAYLIST (LAGU OTOMATIS LANJUT SAAT SELESAI)
  const handleAutoAdvanceNext = () => {
    if (queue.length === 0) return

    const nextIdx = (currentSongIndex + 1) % queue.length
    const nextSong = queue[nextIdx]

    setCurrentSongIndex(nextIdx)
    setCurrentTimeSeconds(0)
    setIsPlaying(true)

    // Mainkan pemutar lokal
    const player = getYTPlayer()
    if (player) {
      try {
        if (typeof player.seekTo === 'function') player.seekTo(0, true)
        if (typeof player.playVideo === 'function') player.playVideo()
      } catch (err) {
        console.error('Gagal memutar lagu berikutnya:', err)
      }
    }

    // Pancarkan ke pasangan via Supabase Broadcast
    sendBroadcast({
      type: 'CHANGE_SONG',
      payload: {
        songId: nextSong.id,
        videoId: nextSong.videoId,
        shouldPlay: true,
      },
    })

    // Simpan ke Supabase Database (rooms)
    saveRoomState({
      currentSong: nextSong,
      isPlaying: true,
      currentTime: 0,
    })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'play',
        text: `Otomatis lanjut ke: ${nextSong.title}`,
        time: timeStr,
        user: 'Sistem',
      },
      ...prev,
    ])
  }

  // 6. TIMER UPDATE PROGRES DARI YOUTUBE PLAYER SECARA PRESISI
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isPlaying) {
      interval = setInterval(() => {
        try {
          const player = getYTPlayer()
          if (player && typeof player.getCurrentTime === 'function') {
            const time = player.getCurrentTime()
            if (!isNaN(time)) {
              setCurrentTimeSeconds(Math.floor(time))
            }
          }
        } catch (err) {
          // ignore
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  // 7. AKSI KONTROL PLAY / PAUSE DARI PENGGUNA LOKAL
  const handleTogglePlay = () => {
    const player = getYTPlayer()
    const nextState = !isPlaying
    let currentTime = currentTimeSeconds

    if (player && typeof player.getCurrentTime === 'function') {
      const t = player.getCurrentTime()
      if (!isNaN(t)) currentTime = t
    }

    if (nextState) {
      if (player && typeof player.playVideo === 'function') {
        player.playVideo()
      }
      sendBroadcast({
        type: 'PLAYER_PLAY',
        payload: {
          currentTime,
          timestamp: Date.now(),
          songId: currentSong?.id,
        },
      })
    } else {
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo()
      }
      sendBroadcast({
        type: 'PLAYER_PAUSE',
        payload: {
          currentTime,
          songId: currentSong?.id,
        },
      })
    }

    setIsPlaying(nextState)

    // Simpan ke database Supabase
    saveRoomState({
      isPlaying: nextState,
      currentTime,
    })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: nextState ? 'play' : 'pause',
        text: `${storedNickname} ${nextState ? 'memutar' : 'menjeda'} musik`,
        time: timeStr,
        user: storedNickname,
      },
      ...prev,
    ])
  }

  // 8. AKSI SEEK BAR DARI PENGGUNA LOKAL
  const handleSeek = (newTime: number) => {
    const player = getYTPlayer()
    if (player && typeof player.seekTo === 'function') {
      player.seekTo(newTime, true)
    }
    setCurrentTimeSeconds(newTime)
    sendBroadcast({
      type: 'PLAYER_SEEK',
      payload: {
        newTime,
        songId: currentSong?.id,
      },
    })
    saveRoomState({ currentTime: newTime })
  }

  // 9. AKSI SKIP NEXT & PREV
  const handleSkipNext = () => {
    if (queue.length === 0) return
    const nextIdx = (currentSongIndex + 1) % queue.length
    const nextSong = queue[nextIdx]
    setCurrentSongIndex(nextIdx)
    setCurrentTimeSeconds(0)
    setIsPlaying(true)

    const player = getYTPlayer()
    if (player) {
      try {
        if (typeof player.seekTo === 'function') player.seekTo(0, true)
        if (typeof player.playVideo === 'function') player.playVideo()
      } catch (err) {
        // ignore
      }
    }

    sendBroadcast({
      type: 'CHANGE_SONG',
      payload: {
        songId: nextSong.id,
        videoId: nextSong.videoId,
        shouldPlay: true,
      },
    })

    saveRoomState({
      currentSong: nextSong,
      isPlaying: true,
      currentTime: 0,
    })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'play',
        text: `${storedNickname} beralih ke lagu: ${nextSong.title}`,
        time: timeStr,
        user: storedNickname,
      },
      ...prev,
    ])
  }

  const handleSkipPrev = () => {
    if (queue.length === 0) return
    const prevIdx = currentSongIndex === 0 ? queue.length - 1 : currentSongIndex - 1
    const prevSong = queue[prevIdx]
    setCurrentSongIndex(prevIdx)
    setCurrentTimeSeconds(0)
    setIsPlaying(true)

    const player = getYTPlayer()
    if (player) {
      try {
        if (typeof player.seekTo === 'function') player.seekTo(0, true)
        if (typeof player.playVideo === 'function') player.playVideo()
      } catch (err) {
        // ignore
      }
    }

    sendBroadcast({
      type: 'CHANGE_SONG',
      payload: {
        songId: prevSong.id,
        videoId: prevSong.videoId,
        shouldPlay: true,
      },
    })

    saveRoomState({
      currentSong: prevSong,
      isPlaying: true,
      currentTime: 0,
    })
  }

  // 10. AKSI PUTAR LAGU DARI DAFTAR ANTREAN
  const handlePlaySong = (songId: string) => {
    const idx = queue.findIndex((s) => s.id === songId)
    if (idx !== -1) {
      const selectedSong = queue[idx]
      setCurrentSongIndex(idx)
      setCurrentTimeSeconds(0)
      setIsPlaying(true)

      const player = getYTPlayer()
      if (player) {
        try {
          if (typeof player.seekTo === 'function') player.seekTo(0, true)
          if (typeof player.playVideo === 'function') player.playVideo()
        } catch (err) {
          // ignore
        }
      }

      sendBroadcast({
        type: 'CHANGE_SONG',
        payload: {
          songId,
          videoId: selectedSong.videoId,
          shouldPlay: true,
        },
      })

      saveRoomState({
        currentSong: selectedSong,
        isPlaying: true,
        currentTime: 0,
      })

      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      setActivities((prev) => [
        {
          id: 'act-' + Date.now(),
          type: 'play',
          text: `Memutar ${selectedSong.title}`,
          time: timeStr,
          user: storedNickname,
        },
        ...prev,
      ])
    }
  }

  // 11. AKSI TAMBAH LAGU KE ANTREAN BERSAMA
  const handleAddSong = (newSongData: Omit<Song, 'id'>) => {
    const newSong: Song = {
      ...newSongData,
      id: 'song-' + Date.now(),
      addedBy: storedNickname,
    }
    const updatedQueue = [...queue, newSong]
    setQueue(updatedQueue)

    sendBroadcast({
      type: 'ADD_QUEUE',
      payload: { song: newSong },
    })

    saveRoomState({ playlist: updatedQueue })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'add_song',
        text: `${storedNickname} menambahkan "${newSong.title}"`,
        time: timeStr,
        user: storedNickname,
      },
      ...prev,
    ])
  }

  // 12. AKSI HAPUS LAGU DARI ANTREAN
  const handleRemoveSong = (songId: string) => {
    const updatedQueue = queue.filter((s) => s.id !== songId)
    setQueue(updatedQueue)

    sendBroadcast({
      type: 'REMOVE_QUEUE',
      payload: { songId },
    })

    saveRoomState({ playlist: updatedQueue })

    if (currentSong?.id === songId) {
      setCurrentTimeSeconds(0)
      setCurrentSongIndex(0)
    }
  }

  // 13. AKSI REORDERING / PENGURUTAN ANTREAN
  const handleReorderQueue = (newQueue: Song[]) => {
    setQueue(newQueue)

    if (currentSong) {
      const newIdx = newQueue.findIndex((s) => s.id === currentSong.id)
      if (newIdx !== -1) {
        setCurrentSongIndex(newIdx)
      }
    }

    sendBroadcast({
      type: 'REORDER_QUEUE',
      payload: { queue: newQueue },
    })

    saveRoomState({ playlist: newQueue })
  }

  // 14. AKSI CHAT REAL-TIME (LIVE CHAT VIA SUPABASE BROADCAST)
  const handleSendMessage = (text: string) => {
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const timestamp = Date.now()

    const newMsg: ChatMessage = {
      id: 'msg-' + timestamp,
      sender: storedNickname,
      text,
      timestamp: timeStr,
      isSelf: true,
    }
    setMessages((prev) => [...prev, newMsg])

    sendBroadcast({
      type: 'CHAT_MESSAGE',
      payload: {
        sender: storedNickname,
        message: text,
        timestamp,
      },
    })
  }

  // 15. ANIMASI DETAK CINTA
  const triggerFloatingHearts = () => {
    const newParticles: HeartParticle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * 60,
      size: 24 + Math.random() * 28,
      duration: 2.5 + Math.random() * 1.5,
    }))

    setHearts((prev) => [...prev, ...newParticles])
    setTimeout(() => {
      setHearts((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)))
    }, 4500)
  }

  const handleSendHeart = () => {
    triggerFloatingHearts()

    sendBroadcast({
      type: 'SEND_LOVE',
      payload: {
        sender: storedNickname,
        timestamp: Date.now(),
      },
    })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'reaction',
        text: `${storedNickname} mengirimkan getaran cinta di layar!`,
        time: timeStr,
        user: storedNickname,
      },
      ...prev,
    ])
  }

  // 16. KONTROL VOLUME & MUTE UNTUK YOUTUBE
  const handleVolumeChange = (vol: number) => {
    setVolume(vol)
    const player = getYTPlayer()
    if (player && typeof player.setVolume === 'function') {
      player.setVolume(vol)
    }
  }

  const handleToggleMute = () => {
    const nextMute = !isMuted
    setIsMuted(nextMute)
    const player = getYTPlayer()
    if (player) {
      if (nextMute && typeof player.mute === 'function') {
        player.mute()
      } else if (!nextMute && typeof player.unMute === 'function') {
        player.unMute()
      }
    }
  }

  const handleLeaveRoom = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#fcf8f9] flex flex-col relative text-[#1e1b1d] font-sans selection:bg-[#ec4899] selection:text-white">
      {/* Floating vector hearts animation layer */}
      <FloatingHearts hearts={hearts} />

      {/* Navbar Responsif dengan Presence Status Pasangan */}
      <Navbar
        roomId={roomId || 'SYNC-ROOM'}
        partnerName={partnerName}
        isPartnerOnline={isPartnerOnline}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Konten Utama Halaman Ruang Dengar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* KOLOM KIRI (7 SPAN): Media Player Bersih & Control Panel */}
          <section className="lg:col-span-7 space-y-6">
            <MusicPlayer
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayerReady={(player) => {
                playerRef.current = player
              }}
              onDurationChange={(dur) => {
                setTotalDurationSeconds(dur)
              }}
              onPlayerStateChange={(state) => {
                // YouTube API: 1 = playing, 2 = paused, 0 = ended
                if (state === 1) setIsPlaying(true)
                if (state === 2) setIsPlaying(false)
                if (state === 0) {
                  // AUTO-ADVANCE: Otomatis lanjut ke lagu berikutnya saat video selesai
                  handleAutoAdvanceNext()
                }
              }}
              volume={volume}
              isMuted={isMuted}
            />

            <ControlPanel
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onSkipNext={handleSkipNext}
              onSkipPrev={handleSkipPrev}
              currentTimeSeconds={currentTimeSeconds}
              totalDurationSeconds={totalDurationSeconds}
              onSeek={handleSeek}
              onSendHeart={handleSendHeart}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          </section>

          {/* KOLOM KANAN (5 SPAN): Antrean Lagu dengan Reordering & Live Chat */}
          <section className="lg:col-span-5 space-y-6">
            <PlaylistQueue
              queue={queue}
              currentSongId={currentSong?.id}
              onPlaySong={handlePlaySong}
              onRemoveSong={handleRemoveSong}
              onAddSong={handleAddSong}
              onReorderQueue={handleReorderQueue}
            />

            <ChatAndActivity
              messages={messages}
              activities={activities}
              onSendMessage={handleSendMessage}
              onSendHeart={handleSendHeart}
            />
          </section>

        </div>
      </main>

      {/* Footer Estetis Light Mode */}
      <footer className="w-full py-4 text-center text-xs text-zinc-500 border-t border-[#f0dbe2] bg-white">
        <p>OurSync &bull; Menghubungkan Nada dan Hati Pasangan Secara Real-Time via Supabase</p>
      </footer>
    </div>
  )
}
