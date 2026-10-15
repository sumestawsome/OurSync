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
  JoinerMergeChoiceModal,
  HostApprovalModal,
} from '../components/MergePlaylistModal'
import type { Song, ChatMessage, ActivityLog, BroadcastEvent } from '../types'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { loadPersonalPlaylist, savePersonalPlaylist } from '../utils/personalPlaylist'
import { formatDuration } from '../utils/youtube'

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { activeName, activeId, isGoogleUser, loading: authLoading } = useAuth()

  // State antrean & pemutar (KOSONG secara default untuk ruangan baru)
  const [queue, setQueue] = useState<Song[]>([])
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0)
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)

  // State chat & aktivitas & partikel afeksi (KOSONG secara default)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [hearts, setHearts] = useState<HeartParticle[]>([])

  // State kehadiran pasangan (Presence)
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const [partnerName, setPartnerName] = useState('Pasangan')

  // State Penggabungan Playlist Pribadi (Merge System)
  const [personalPlaylist, setPersonalPlaylist] = useState<Song[]>([])
  const [showJoinerChoiceModal, setShowJoinerChoiceModal] = useState(false)
  const [showHostApprovalModal, setShowHostApprovalModal] = useState(false)
  const [pendingMergeRequest, setPendingMergeRequest] = useState<{
    requesterId: string
    requesterName: string
    songs: Song[]
  } | null>(null)

  const hasCheckedMergePrompt = useRef(false)
  const playerRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const clientId = useRef<string>('client-' + Math.random().toString(36).substring(2, 9)).current

  // Referensi Waktu Ruangan untuk Instant Catch-Up Audio
  const expectedBaseTime = useRef<number>(0)
  const expectedBaseTimestamp = useRef<number>(Date.now())
  const queueRef = useRef<Song[]>(queue)
  queueRef.current = queue

  // State & Timer untuk Deteksi Pemblokiran Autoplay pada Browser HP
  const [showAutoplayUnlock, setShowAutoplayUnlock] = useState(false)
  const autoplayCheckTimerRef = useRef<any>(null)

  const currentSong = queue[currentSongIndex] || null
  const isHost = typeof window !== 'undefined' && sessionStorage.getItem('oursync_host_' + roomId) === 'true'

  // Helper untuk mendapatkan instance YouTube player
  const getYTPlayer = () => {
    if (!playerRef.current) return null
    return playerRef.current.internalPlayer || playerRef.current
  }

  // BROADCAST HELPER UNTUK MENGIRIM EVENT KE PASANGAN
  const sendBroadcast = (event: BroadcastEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'music_sync',
        payload: event,
      })
    }
  }

  // Deteksi pemblokiran autoplay browser HP: jika isPlaying namun player belum state 1 (PLAYING) dalam 2 detik
  const startAutoplayCheck = () => {
    if (autoplayCheckTimerRef.current) {
      clearTimeout(autoplayCheckTimerRef.current)
    }

    autoplayCheckTimerRef.current = setTimeout(() => {
      const player = getYTPlayer()
      let playerState: number | null = null
      if (player && typeof player.getPlayerState === 'function') {
        try {
          playerState = player.getPlayerState()
        } catch {
          // ignore
        }
      }
      // Jika setelah 2 detik player lokal tidak mencapai state PLAYING (1), buka overlay bantuan gesture
      if (playerState !== 1) {
        setShowAutoplayUnlock(true)
      }
    }, 2000)
  }

  const cancelAutoplayCheck = () => {
    if (autoplayCheckTimerRef.current) {
      clearTimeout(autoplayCheckTimerRef.current)
      autoplayCheckTimerRef.current = null
    }
    setShowAutoplayUnlock(false)
  }

  // Hitung perkiraan detik pemutaran yang seharusnya sedang berjalan di ruangan
  const getExpectedCurrentTime = () => {
    const elapsed = Math.max(0, (Date.now() - expectedBaseTimestamp.current) / 1000)
    return expectedBaseTime.current + elapsed
  }

  // Aksi interaktif ketika pengguna mengetuk "Ketuk untuk Menyelaraskan Audio"
  const handleUnlockAutoplay = () => {
    const player = getYTPlayer()
    if (player) {
      try {
        const expectedTime = getExpectedCurrentTime()
        if (typeof player.seekTo === 'function') {
          player.seekTo(expectedTime, true)
        }
        if (typeof player.playVideo === 'function') {
          player.playVideo()
        }
        setCurrentTimeSeconds(Math.floor(expectedTime))
      } catch (err) {
        console.error('Gagal membuka izin autoplay browser:', err)
      }
    }
    cancelAutoplayCheck()
  }

  // Helper untuk menyimpan state room:
  // - Transient Room Queue khusus sesi room_id
  // - Simpan ke Supabase tabel rooms dan LocalStorage
  const saveRoomState = async (updates: {
    playlist?: Song[]
    currentSong?: Song | null
    isPlaying?: boolean
    currentTime?: number
  }) => {
    if (!roomId) return
    const activeQueue = updates.playlist ?? queue
    const activeSong = updates.currentSong !== undefined ? updates.currentSong : currentSong
    const activePlaying = updates.isPlaying ?? isPlaying
    const activeTime = updates.currentTime ?? currentTimeSeconds

    // Simpan ke Local Storage (cadangan lokal)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`oursync_room_${roomId}`, JSON.stringify({
          playlist: activeQueue,
          currentSong: activeSong,
          isPlaying: activePlaying,
          currentTime: activeTime,
          updatedAt: new Date().toISOString(),
        }))
      } catch (e) {
        // ignore
      }
    }

    // Simpan ke database Supabase tabel rooms agar sinkron lintas perangkat
    try {
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

  // SINKRONISASI AUDIO OPTIMISTIK: Muat aktif lagu seketika via loadVideoById tanpa handshake blocking
  const changeAndPlaySong = (songId: string, activityText?: string) => {
    const targetIdx = queueRef.current.findIndex((s) => s.id === songId)
    if (targetIdx === -1) return
    const targetSong = queueRef.current[targetIdx]

    const now = Date.now()
    expectedBaseTime.current = 0
    expectedBaseTimestamp.current = now

    // Update antrean lokal seketika
    setCurrentSongIndex(targetIdx)
    setCurrentTimeSeconds(0)
    setTotalDurationSeconds(targetSong?.durationSeconds || 0)
    setIsPlaying(true)

    // Muat aktif video secara langsung menggunakan player.loadVideoById
    const player = getYTPlayer()
    if (player) {
      try {
        if (targetSong.videoId && typeof player.loadVideoById === 'function') {
          try {
            player.loadVideoById({
              videoId: targetSong.videoId,
              startSeconds: 0,
            })
          } catch {
            player.loadVideoById(targetSong.videoId, 0)
          }
        } else {
          if (typeof player.seekTo === 'function') player.seekTo(0, true)
          if (typeof player.playVideo === 'function') player.playVideo()
        }
      } catch (err) {
        console.warn('Gagal memuat video lokal langsung:', err)
      }
    }

    // Pancarkan langsung event CHANGE_SONG ke pasangan tanpa blocking
    sendBroadcast({
      type: 'CHANGE_SONG',
      payload: {
        songId,
        videoId: targetSong.videoId,
        shouldPlay: true,
        startTime: 0,
        timestamp: now,
      },
    })

    saveRoomState({
      currentSong: targetSong,
      isPlaying: true,
      currentTime: 0,
    })

    // Jalankan pengecekan autoplay block (2 detik)
    startAutoplayCheck()

    if (activityText) {
      const date = new Date()
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      setActivities((prev) => [
        {
          id: 'act-' + Date.now(),
          type: 'play',
          text: activityText,
          time: timeStr,
          user: activeName,
        },
        ...prev,
      ])
    }
  }

  // 1. FETCH DATA ANTREAN RUANGAN (DARI SUPABASE ATAU LOCAL STORAGE)
  useEffect(() => {
    if (!roomId) return

    const loadRoomData = async () => {
      // 1. Prioritaskan ambil antrean ruangan dari database Supabase
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_id', roomId)
          .maybeSingle()

        if (data && !error && Array.isArray(data.playlist) && data.playlist.length > 0) {
          setQueue(data.playlist)
          if (data.current_song) {
            const idx = data.playlist.findIndex((s: Song) => s.id === data.current_song.id)
            if (idx !== -1) {
              setCurrentSongIndex(idx)
              if (data.current_song.durationSeconds) {
                setTotalDurationSeconds(data.current_song.durationSeconds)
              }
            }
          }
          if (typeof data.current_time === 'number') {
            setCurrentTimeSeconds(Math.floor(data.current_time))
          }
          if (typeof data.is_playing === 'boolean') {
            setIsPlaying(data.is_playing)
          }
          return
        }
      } catch (err) {
        console.warn('Info persistensi room Supabase:', err)
      }

      // 2. Jika belum ada di Supabase, periksa Local Storage
      if (typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem(`oursync_room_${roomId}`)
          if (local) {
            const parsed = JSON.parse(local)
            if (Array.isArray(parsed.playlist) && parsed.playlist.length > 0) {
              setQueue(parsed.playlist)
              if (parsed.currentSong) {
                const idx = parsed.playlist.findIndex((s: Song) => s.id === parsed.currentSong.id)
                if (idx !== -1) {
                  setCurrentSongIndex(idx)
                  if (parsed.currentSong.durationSeconds) {
                    setTotalDurationSeconds(parsed.currentSong.durationSeconds)
                  }
                }
              }
              if (typeof parsed.currentTime === 'number') {
                setCurrentTimeSeconds(Math.floor(parsed.currentTime))
              }
              if (typeof parsed.isPlaying === 'boolean') {
                setIsPlaying(parsed.isPlaying)
              }
              return
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Jika ruangan baru dan pengguna adalah HOST:
      // Ambil template awal HANYA dari koleksi pribadi akun host (read-only snapshot)
      if (isHost) {
        try {
          const personalSongs = await loadPersonalPlaylist(activeId, isGoogleUser)
          if (personalSongs && personalSongs.length > 0) {
            const initialQueue = personalSongs.map((s) => ({ ...s }))
            setQueue(initialQueue)
            setCurrentSongIndex(0)
            setCurrentTimeSeconds(0)
            setTotalDurationSeconds(initialQueue[0]?.durationSeconds || 0)
            saveRoomState({
              playlist: initialQueue,
              currentSong: initialQueue[0] || null,
              isPlaying: false,
              currentTime: 0,
            })
            return
          }
        } catch (err) {
          console.warn('Gagal memuat template koleksi pribadi untuk room baru:', err)
        }
      }

      // Jika ruangan baru tanpa template koleksi: antrean KOSONG
      setQueue([])
      setCurrentSongIndex(0)
      setCurrentTimeSeconds(0)
      setTotalDurationSeconds(0)
    }

    loadRoomData()
  }, [roomId, isHost, activeId, isGoogleUser])

  // 2. FETCH OBROLAN (DARI SUPABASE JIKA LOGIN GOOGLE, ATAU LOCAL STORAGE JIKA GUEST)
  useEffect(() => {
    if (!roomId) return

    const loadDirectMessages = async () => {
      // Jika login Google: ambil pesan persisten dari database Supabase
      if (isGoogleUser) {
        try {
          const { data, error } = await supabase
            .from('direct_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })
            .limit(100)

          if (data && !error && data.length > 0) {
            const formatted: ChatMessage[] = data.map((m: any) => {
              const date = new Date(m.created_at)
              const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
              return {
                id: m.id || 'msg-' + Date.now(),
                sender: m.sender_name || 'Pasangan',
                text: m.message,
                timestamp: timeStr,
                isSelf: m.sender_id === activeId,
              }
            })
            setMessages(formatted)
            return
          }
        } catch (err) {
          console.warn('Gagal memuat pesan obrolan persisten dari database:', err)
        }
      }

      // Jika Guest: ambil pesan dari Local Storage
      if (typeof window !== 'undefined') {
        try {
          const localChat = localStorage.getItem(`oursync_chat_${roomId}`)
          if (localChat) {
            const parsed = JSON.parse(localChat)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed)
              return
            }
          }
        } catch {
          // ignore
        }
      }

      // Ruangan baru: riwayat obrolan KOSONG
      setMessages([])
    }

    loadDirectMessages()
  }, [roomId, activeId, isGoogleUser])

  // 3. CEK PLAYLIST PRIBADI UNTUK PENGGUNA YANG BERGABUNG (JOINER)
  useEffect(() => {
    if (!roomId || authLoading) return
    let isMounted = true

    const checkPersonalPlaylist = async () => {
      const pPlaylist = await loadPersonalPlaylist(activeId, isGoogleUser)
      if (!isMounted) return
      setPersonalPlaylist(pPlaylist)

      // Jika bukan Host dan memiliki lagu di playlist pribadi, tanyakan pilihan penggabungan sekali saja
      if (!isHost && pPlaylist.length > 0 && !hasCheckedMergePrompt.current) {
        hasCheckedMergePrompt.current = true
        setShowJoinerChoiceModal(true)
      }
    }

    checkPersonalPlaylist()

    return () => {
      isMounted = false
    }
  }, [roomId, activeId, isHost, isGoogleUser, authLoading])

  // 4. SUPABASE REALTIME CHANNEL (BROADCAST & PRESENCE)
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
            user: activeName,
            online_at: new Date().toISOString(),
          })

          // Minta sinkronisasi antrean sesi ruangan terkini dari host/peer aktif
          channel.send({
            type: 'broadcast',
            event: 'music_sync',
            payload: {
              type: 'REQUEST_ROOM_SYNC',
              payload: { requesterId: clientId },
            },
          })
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId, clientId, activeName])

  // 5. LOGIKA MENANGANI EVENT BROADCAST YANG DITERIMA DARI PASANGAN
  const handleIncomingBroadcast = (event: BroadcastEvent) => {
    const player = getYTPlayer()

    switch (event.type) {
      case 'PLAYER_PLAY': {
        const { currentTime, timestamp } = event.payload
        expectedBaseTime.current = currentTime
        expectedBaseTimestamp.current = timestamp

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
        startAutoplayCheck()

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

      // PERIODIC HEARTBEAT SYNC: Penjaga drift ringan dari Host setiap 5 detik
      case 'PLAYER_HEARTBEAT': {
        const { currentTime: hostTime, timestamp, songId } = event.payload
        expectedBaseTime.current = hostTime
        expectedBaseTimestamp.current = timestamp

        if (!isHost && isPlaying) {
          if (songId && currentSong && songId !== currentSong.id) {
            break
          }
          if (!player) break

          let localTime = currentTimeSeconds
          if (typeof player.getCurrentTime === 'function') {
            const t = player.getCurrentTime()
            if (!isNaN(t)) localTime = t
          }

          const latency = Math.max(0, (Date.now() - timestamp) / 1000)
          const targetHostTime = hostTime + latency

          const drift = Math.abs(localTime - targetHostTime)
          // Jika selisih waktu melebihi 1.5 detik (terjadi drift akibat buffering jaringan HP), eksekusi koreksi otomatis
          if (drift > 1.5) {
            if (typeof player.seekTo === 'function') {
              player.seekTo(targetHostTime, true)
            }
            setCurrentTimeSeconds(Math.floor(targetHostTime))
          }
        }
        break
      }

      case 'PLAYER_PAUSE': {
        const { currentTime } = event.payload
        cancelAutoplayCheck()
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
        expectedBaseTime.current = newTime
        expectedBaseTimestamp.current = Date.now()

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
        const { songId, videoId, shouldPlay, startTime = 0, timestamp = Date.now() } = event.payload
        expectedBaseTime.current = startTime
        expectedBaseTimestamp.current = timestamp

        setQueue((currentQueue) => {
          const idx = currentQueue.findIndex((s) => s.id === songId)
          if (idx !== -1) {
            setCurrentSongIndex(idx)
            setCurrentTimeSeconds(Math.floor(startTime))
            if (currentQueue[idx]?.durationSeconds) {
              setTotalDurationSeconds(currentQueue[idx].durationSeconds)
            }
          }
          return currentQueue
        })

        if (shouldPlay) {
          setIsPlaying(true)
          startAutoplayCheck()

          const latency = Math.max(0, (Date.now() - timestamp) / 1000)
          const targetStartSeconds = startTime + latency

          const p = getYTPlayer()
          if (p) {
            try {
              const targetVidId = videoId || queueRef.current.find((s) => s.id === songId)?.videoId
              if (targetVidId && typeof p.loadVideoById === 'function') {
                try {
                  p.loadVideoById({
                    videoId: targetVidId,
                    startSeconds: targetStartSeconds,
                  })
                } catch {
                  p.loadVideoById(targetVidId, targetStartSeconds)
                }
              } else {
                if (typeof p.seekTo === 'function') p.seekTo(targetStartSeconds, true)
                if (typeof p.playVideo === 'function') p.playVideo()
              }
            } catch (e) {
              // ignore
            }
          }
        }
        break
      }

      case 'ADD_QUEUE': {
        const { song } = event.payload
        setQueue((prev) => [...prev, song])
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
        setMessages((prev) => {
          const next = [...prev, incomingMsg]
          if (!isGoogleUser && typeof window !== 'undefined') {
            try {
              localStorage.setItem(`oursync_chat_${roomId}`, JSON.stringify(next))
            } catch {
              // ignore
            }
          }
          return next
        })
        break
      }

      // 6. EVENT PERMINTAAN GABUNG PLAYLIST DITERIMA HOST
      case 'REQUEST_MERGE_PLAYLIST': {
        setPendingMergeRequest(event.payload)
        setShowHostApprovalModal(true)
        break
      }

      // 7. EVENT RESPON GABUNG PLAYLIST DITERIMA JOINER
      case 'RESPONSE_MERGE_PLAYLIST': {
        const { accepted, hostName, mergedQueue } = event.payload
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

        if (accepted && mergedQueue) {
          setQueue(mergedQueue)
          setActivities((prev) => [
            {
              id: 'act-' + Date.now(),
              type: 'add_song',
              text: `${hostName} menyetujui penggabungan playlist! Playlist kamu berhasil digabung.`,
              time: timeStr,
              user: hostName,
            },
            ...prev,
          ])
        } else {
          setActivities((prev) => [
            {
              id: 'act-' + Date.now(),
              type: 'pause',
              text: `${hostName} menolak penggabungan playlist. Menggunakan playlist host.`,
              time: timeStr,
              user: hostName,
            },
            ...prev,
          ])
        }
        break
      }

      // 7a. PERMINTAAN SINKRONISASI ANTREAN RUANGAN DARI PEER
      case 'REQUEST_ROOM_SYNC': {
        if (queue.length > 0) {
          sendBroadcast({
            type: 'RESPONSE_ROOM_SYNC',
            payload: {
              queue,
              currentSongIndex,
              isPlaying,
              currentTime: currentTimeSeconds,
            },
          })
        }
        break
      }

      // 7b. RESPON SINKRONISASI ANTREAN RUANGAN YANG DITERIMA DARI PEER/HOST
      case 'RESPONSE_ROOM_SYNC': {
        const { queue: syncedQueue, currentSongIndex: syncedIdx, isPlaying: syncedPlaying, currentTime: syncedTime } = event.payload
        if (Array.isArray(syncedQueue) && syncedQueue.length > 0) {
          setQueue(syncedQueue)
          if (typeof syncedIdx === 'number' && syncedQueue[syncedIdx]) {
            setCurrentSongIndex(syncedIdx)
            if (syncedQueue[syncedIdx].durationSeconds) {
              setTotalDurationSeconds(syncedQueue[syncedIdx].durationSeconds)
            }
          }
          if (typeof syncedTime === 'number') {
            setCurrentTimeSeconds(Math.floor(syncedTime))
          }
          if (typeof syncedPlaying === 'boolean') {
            setIsPlaying(syncedPlaying)
          }
        }
        break
      }
    }
  }

  // 9. LOGIKA PERSETUJUAN PENGGABUNGAN PLAYLIST DI SISI HOST
  const handleAcceptMergeRequest = () => {
    if (!pendingMergeRequest) return
    const { requesterName, songs } = pendingMergeRequest

    // Gabungkan lagu tanpa duplikasi ID
    const existingIds = new Set(queue.map((s) => s.id))
    const uniqueNewSongs = songs.filter((s) => !existingIds.has(s.id))
    const mergedQueue = [...queue, ...uniqueNewSongs]

    setQueue(mergedQueue)
    setShowHostApprovalModal(false)
    setPendingMergeRequest(null)

    // Pancarkan ke pasangan bahwa permintaan disetujui beserta playlist gabungannya
    sendBroadcast({
      type: 'RESPONSE_MERGE_PLAYLIST',
      payload: {
        requesterId: pendingMergeRequest.requesterId,
        accepted: true,
        hostName: activeName,
        mergedQueue,
      },
    })

    // Update antrean ke Supabase rooms
    saveRoomState({ playlist: mergedQueue })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'add_song',
        text: `Menyetujui penggabungan playlist dari ${requesterName} (+${uniqueNewSongs.length} lagu)`,
        time: timeStr,
        user: activeName,
      },
      ...prev,
    ])
  }

  const handleRejectMergeRequest = () => {
    if (!pendingMergeRequest) return
    const { requesterId, requesterName } = pendingMergeRequest

    setShowHostApprovalModal(false)
    setPendingMergeRequest(null)

    sendBroadcast({
      type: 'RESPONSE_MERGE_PLAYLIST',
      payload: {
        requesterId,
        accepted: false,
        hostName: activeName,
      },
    })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'pause',
        text: `Menolak penggabungan playlist dari ${requesterName}`,
        time: timeStr,
        user: activeName,
      },
      ...prev,
    ])
  }

  // 10. AKSI JOINER MENGIRIM PERMINTAAN GABUNG PLAYLIST KE HOST
  const handleRequestMergePlaylist = () => {
    // Ambil salinan array read-only agar koleksi pribadi joiner tidak termutasi
    const songsToMerge = personalPlaylist.map((s) => ({ ...s }))
    sendBroadcast({
      type: 'REQUEST_MERGE_PLAYLIST',
      payload: {
        requesterId: activeId,
        requesterName: activeName,
        songs: songsToMerge,
      },
    })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'add_song',
        text: `Mengirimkan permintaan penggabungan playlist ke pemilik ruangan...`,
        time: timeStr,
        user: activeName,
      },
      ...prev,
    ])
  }

  // 11. FITUR AUTO-ADVANCE PLAYLIST (LAGU OTOMATIS LANJUT SAAT SELESAI)
  const handleAutoAdvanceNext = () => {
    if (queue.length === 0) return

    const nextIdx = (currentSongIndex + 1) % queue.length
    const nextSong = queue[nextIdx]
    changeAndPlaySong(nextSong.id, `Otomatis lanjut ke: ${nextSong.title}`)
  }

  // 12. TIMER UPDATE PROGRES DARI YOUTUBE PLAYER SECARA PRESISI & DETEKSI DURASI OTOMATIS
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
          if (player && typeof player.getDuration === 'function') {
            const dur = player.getDuration()
            if (dur && dur > 0) {
              const safeDur = Math.floor(dur)
              const formatted = formatDuration(safeDur)
              setTotalDurationSeconds((prev) => (prev !== safeDur ? safeDur : prev))
              setQueue((prevQueue) => {
                const current = prevQueue[currentSongIndex]
                if (current && (current.duration !== formatted || current.durationSeconds !== safeDur)) {
                  return prevQueue.map((s, idx) =>
                    idx === currentSongIndex
                      ? { ...s, duration: formatted, durationSeconds: safeDur }
                      : s
                  )
                }
                return prevQueue
              })
            }
          }
        } catch (err) {
          // ignore
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentSongIndex])

  // 12b. INTERVAL SINKRONISASI PENJAGA DRIFT (HOST MEMANCARKAN HEARTBEAT SETIAP 5 DETIK)
  useEffect(() => {
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null

    if (isHost && isPlaying && currentSong) {
      heartbeatInterval = setInterval(() => {
        const player = getYTPlayer()
        let currentT = currentTimeSeconds
        if (player && typeof player.getCurrentTime === 'function') {
          const t = player.getCurrentTime()
          if (!isNaN(t) && t >= 0) {
            currentT = t
          }
        }

        sendBroadcast({
          type: 'PLAYER_HEARTBEAT',
          payload: {
            currentTime: currentT,
            timestamp: Date.now(),
            songId: currentSong.id,
          },
        })
      }, 5000)
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval)
    }
  }, [isHost, isPlaying, currentSong, currentTimeSeconds])

  // Cleanup timer deteksi autoplay saat komponen unmount
  useEffect(() => {
    return () => {
      if (autoplayCheckTimerRef.current) {
        clearTimeout(autoplayCheckTimerRef.current)
      }
    }
  }, [])

  // 13. AKSI KONTROL PLAY / PAUSE DARI PENGGUNA LOKAL
  const handleTogglePlay = () => {
    const player = getYTPlayer()
    const nextState = !isPlaying
    let currentTime = currentTimeSeconds

    if (player && typeof player.getCurrentTime === 'function') {
      const t = player.getCurrentTime()
      if (!isNaN(t)) currentTime = t
    }

    if (nextState) {
      const now = Date.now()
      expectedBaseTime.current = currentTime
      expectedBaseTimestamp.current = now

      if (player && typeof player.playVideo === 'function') {
        player.playVideo()
      }
      sendBroadcast({
        type: 'PLAYER_PLAY',
        payload: {
          currentTime,
          timestamp: now,
          songId: currentSong?.id,
        },
      })
      startAutoplayCheck()
    } else {
      cancelAutoplayCheck()
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
        text: `${activeName} ${nextState ? 'memutar' : 'menjeda'} musik`,
        time: timeStr,
        user: activeName,
      },
      ...prev,
    ])
  }

  // 14. AKSI SEEK BAR DARI PENGGUNA LOKAL
  const handleSeek = (newTime: number) => {
    const player = getYTPlayer()
    if (player && typeof player.seekTo === 'function') {
      player.seekTo(newTime, true)
    }
    expectedBaseTime.current = newTime
    expectedBaseTimestamp.current = Date.now()
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

  // 15. AKSI SKIP NEXT & PREV
  const handleSkipNext = () => {
    if (queue.length === 0) return
    const nextIdx = (currentSongIndex + 1) % queue.length
    const nextSong = queue[nextIdx]
    changeAndPlaySong(nextSong.id, `${activeName} beralih ke lagu: ${nextSong.title}`)
  }

  const handleSkipPrev = () => {
    if (queue.length === 0) return
    const prevIdx = currentSongIndex === 0 ? queue.length - 1 : currentSongIndex - 1
    const prevSong = queue[prevIdx]
    changeAndPlaySong(prevSong.id, `${activeName} beralih ke lagu sebelumnya: ${prevSong.title}`)
  }

  // 16. AKSI PUTAR LAGU DARI DAFTAR ANTREAN
  const handlePlaySong = (songId: string) => {
    const selectedSong = queue.find((s) => s.id === songId)
    if (selectedSong) {
      changeAndPlaySong(songId, `Memutar ${selectedSong.title}`)
    }
  }

  // 17. AKSI TAMBAH LAGU KE ANTREAN RUANGAN (ROOM QUEUE)
  // Perhatian: Hanya menambahkan ke sesi antrean ruangan aktif, TIDAK mengubah Playlist Pribadi akun
  const handleAddSong = (newSongData: Omit<Song, 'id'>) => {
    const newSong: Song = {
      ...newSongData,
      id: 'song-' + Date.now(),
      addedBy: activeName,
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
        text: `${activeName} menambahkan "${newSong.title}" ke antrean`,
        time: timeStr,
        user: activeName,
      },
      ...prev,
    ])
  }

  // 17a. AKSI SIMPAN / HAPUS LAGU DARI PLAYLIST PRIBADI AKUN
  const handleSaveToPersonalPlaylist = async (song: Song) => {
    const isAlreadySaved = personalPlaylist.some(
      (s) => s.id === song.id || (s.videoId && s.videoId === song.videoId) || s.title === song.title
    )
    let updated: Song[]
    if (isAlreadySaved) {
      updated = personalPlaylist.filter(
        (s) => s.id !== song.id && (!song.videoId || s.videoId !== song.videoId) && s.title !== song.title
      )
    } else {
      updated = [...personalPlaylist, song]
    }
    setPersonalPlaylist(updated)
    await savePersonalPlaylist(activeId, updated, isGoogleUser)

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'add_song',
        text: isAlreadySaved
          ? `Lagu "${song.title}" dihapus dari Playlist Pribadi`
          : `Lagu "${song.title}" berhasil disimpan ke Playlist Pribadi Akun`,
        time: timeStr,
        user: activeName,
      },
      ...prev,
    ])
  }

  // 17b. AKSI MEMUAT KOLEKSI PRIBADI KE DALAM ANTREAN RUANGAN (ROOM QUEUE)
  const handleImportPersonalPlaylist = () => {
    if (personalPlaylist.length === 0) return
    const existingIds = new Set(queue.map((s) => s.id))
    // Kloning objek lagu dengan ID baru agar tidak terikat referensi dua arah ke personalPlaylist
    const uniqueSongs = personalPlaylist
      .filter((s) => !existingIds.has(s.id))
      .map((s) => ({ ...s, id: 'song-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) }))

    if (uniqueSongs.length === 0) return

    const newQueue = [...queue, ...uniqueSongs]
    setQueue(newQueue)
    saveRoomState({ playlist: newQueue })

    sendBroadcast({
      type: 'REORDER_QUEUE',
      payload: { queue: newQueue },
    })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'add_song',
        text: `${activeName} memuat ${uniqueSongs.length} lagu dari koleksi pribadi ke antrean ruangan`,
        time: timeStr,
        user: activeName,
      },
      ...prev,
    ])
  }

  // 18. AKSI HAPUS LAGU DARI ANTREAN
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

  // 19. AKSI REORDERING / PENGURUTAN ANTREAN
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

  // 20. AKSI CHAT PERSISTEN ANTAR AKUN (DIRECT MESSAGES + REALTIME BROADCAST)
  const handleSendMessage = async (text: string) => {
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const timestamp = Date.now()
    const msgId = 'msg-' + timestamp

    const newMsg: ChatMessage = {
      id: msgId,
      sender: activeName,
      text,
      timestamp: timeStr,
      isSelf: true,
    }

    setMessages((prev) => {
      const nextMessages = [...prev, newMsg]
      if (!isGoogleUser && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`oursync_chat_${roomId}`, JSON.stringify(nextMessages))
        } catch {
          // ignore
        }
      }
      return nextMessages
    })

    // Pancarkan secara real-time ke pasangan
    sendBroadcast({
      type: 'CHAT_MESSAGE',
      payload: {
        sender: activeName,
        message: text,
        timestamp,
      },
    })

    // Simpan secara persisten ke tabel direct_messages di Supabase jika user Google
    if (isGoogleUser) {
      try {
        await supabase.from('direct_messages').insert({
          id: msgId,
          sender_id: activeId,
          sender_name: activeName,
          room_id: roomId,
          message: text,
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        console.warn('Gagal menyimpan chat ke tabel direct_messages:', err)
      }
    }
  }

  // 21. ANIMASI DETAK CINTA
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
        sender: activeName,
        timestamp: Date.now(),
      },
    })

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivities((prev) => [
      {
        id: 'act-' + Date.now(),
        type: 'reaction',
        text: `${activeName} mengirimkan getaran cinta di layar!`,
        time: timeStr,
        user: activeName,
      },
      ...prev,
    ])
  }

  // 22. KONTROL VOLUME & MUTE UNTUK YOUTUBE
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

      {/* MODAL PILIHAN MERGE UNTUK PENGGUNA YANG BARU GABUNG */}
      <JoinerMergeChoiceModal
        isOpen={showJoinerChoiceModal}
        onClose={() => setShowJoinerChoiceModal(false)}
        personalSongCount={personalPlaylist.length}
        onRequestMerge={handleRequestMergePlaylist}
        onUseHostPlaylist={() => {
          // Joiner memilih mendengarkan antrean room yang sudah ada
          // Minta sinkronisasi antrean room secara in-memory tanpa memutasi personal collection akun
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'music_sync',
              payload: {
                type: 'REQUEST_ROOM_SYNC',
                payload: { requesterId: clientId },
              },
            })
          }
          const now = new Date()
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
          setActivities((prev) => [
            {
              id: 'act-' + Date.now(),
              type: 'play',
              text: `Kamu memilih mendengarkan playlist pemilik ruangan`,
              time: timeStr,
              user: activeName,
            },
            ...prev,
          ])
        }}
      />

      {/* MODAL PERSETUJUAN MERGE UNTUK PEMILIK RUANGAN (HOST) */}
      <HostApprovalModal
        isOpen={showHostApprovalModal}
        requesterName={pendingMergeRequest?.requesterName || 'Pasangan'}
        incomingSongs={pendingMergeRequest?.songs || []}
        onAccept={handleAcceptMergeRequest}
        onReject={handleRejectMergeRequest}
      />

      {/* Navbar Responsif dengan Info Profil Akun Google & Status Presence */}
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
              showAutoplayUnlock={showAutoplayUnlock}
              onUnlockAutoplay={handleUnlockAutoplay}
              onPlayerReady={(player) => {
                playerRef.current = player
                if (isPlaying && typeof player.playVideo === 'function') {
                  try {
                    const expectedTime = getExpectedCurrentTime()
                    if (typeof player.seekTo === 'function') player.seekTo(expectedTime, true)
                    player.playVideo()
                  } catch (e) {
                    // ignore
                  }
                }
              }}
              onDurationChange={(dur) => {
                if (dur && dur > 0) {
                  setTotalDurationSeconds(dur)
                  const formatted = formatDuration(dur)
                  setQueue((prevQueue) =>
                    prevQueue.map((s, idx) =>
                      idx === currentSongIndex
                        ? { ...s, duration: formatted, durationSeconds: dur }
                        : s
                    )
                  )
                }
              }}
              onPlayerStateChange={(state) => {
                // YouTube API: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING, 5 = CUED
                if (state === 1) {
                  setIsPlaying(true)
                  cancelAutoplayCheck()

                  // INSTANT CATCH-UP: Saat YouTube di HP baru selesai buffering/loading,
                  // cek apakah tertinggal lebih dari 1.5s dari waktu yang seharusnya berjalan di ruangan.
                  const player = getYTPlayer()
                  if (player && typeof player.getCurrentTime === 'function') {
                    const localTime = player.getCurrentTime()
                    const expectedTime = getExpectedCurrentTime()
                    const diff = Math.abs(localTime - expectedTime)
                    if (diff > 1.5) {
                      if (typeof player.seekTo === 'function') {
                        player.seekTo(expectedTime, true)
                      }
                      setCurrentTimeSeconds(Math.floor(expectedTime))
                    }
                  }
                }
                if (state === 2) {
                  // Player dijeda secara lokal
                }
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
              personalPlaylist={personalPlaylist}
              currentSongId={currentSong?.id}
              onPlaySong={handlePlaySong}
              onRemoveSong={handleRemoveSong}
              onAddSong={handleAddSong}
              onReorderQueue={handleReorderQueue}
              onImportPersonalPlaylist={handleImportPersonalPlaylist}
              onSaveToPersonalPlaylist={handleSaveToPersonalPlaylist}
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
