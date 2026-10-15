export interface Song {
  id: string
  title: string
  artist: string
  duration: string // formatted "03:45"
  durationSeconds: number
  thumbnail: string
  addedBy: string
  url?: string
  videoId?: string
}

export interface ChatMessage {
  id: string
  sender: string
  text: string
  timestamp: string
  isSelf: boolean
}

export interface ActivityLog {
  id: string
  type: 'play' | 'pause' | 'add_song' | 'seek' | 'reaction' | 'join'
  text: string
  time: string
  user: string
}

export interface RoomParticipant {
  id: string
  name: string
  isHost: boolean
  isOnline: boolean
  role: 'partner_1' | 'partner_2'
  avatarInitial: string
}

// Profil Pengguna (Google Auth & Guest)
export interface UserProfile {
  id: string
  email?: string
  name: string
  avatarUrl?: string
  isGuest: boolean
}

// Model tabel Supabase 'user_playlists'
export interface UserPlaylist {
  user_id: string
  playlist: Song[]
  updated_at?: string
}

// Model tabel Supabase 'direct_messages' (Obrolan Persisten)
export interface DirectMessage {
  id: string
  sender_id: string
  sender_name: string
  receiver_id?: string
  room_id: string
  message: string
  created_at: string
}

// Model tabel Supabase 'rooms'
export interface RoomData {
  room_id: string
  playlist: Song[]
  current_song: Song | null
  is_playing: boolean
  current_time: number
  updated_at?: string
}

// Supabase Broadcast Payloads
export type BroadcastEvent =
  | { type: 'PLAYER_PLAY'; payload: { currentTime: number; timestamp: number; songId?: string } }
  | { type: 'PLAYER_PAUSE'; payload: { currentTime: number; songId?: string } }
  | { type: 'PLAYER_SEEK'; payload: { newTime: number; songId?: string } }
  | { type: 'ADD_QUEUE'; payload: { song: Song } }
  | { type: 'REMOVE_QUEUE'; payload: { songId: string } }
  | { type: 'CHANGE_SONG'; payload: { songId: string; videoId?: string; shouldPlay?: boolean } }
  | { type: 'PREPARE_SONG'; payload: { songId: string; videoId?: string; initiatorId: string; timestamp: number } }
  | { type: 'CLIENT_READY'; payload: { songId: string; clientId: string } }
  | { type: 'PLAYER_HEARTBEAT'; payload: { currentTime: number; timestamp: number; songId?: string } }
  | { type: 'REORDER_QUEUE'; payload: { queue: Song[] } }
  | { type: 'SEND_LOVE'; payload: { sender: string; timestamp: number } }
  | { type: 'CHAT_MESSAGE'; payload: { sender: string; message: string; timestamp: number } }
  | { type: 'REQUEST_MERGE_PLAYLIST'; payload: { requesterId: string; requesterName: string; songs: Song[] } }
  | { type: 'RESPONSE_MERGE_PLAYLIST'; payload: { requesterId: string; accepted: boolean; hostName: string; mergedQueue?: Song[] } }
  | { type: 'REQUEST_ROOM_SYNC'; payload: { requesterId: string } }
  | { type: 'RESPONSE_ROOM_SYNC'; payload: { queue: Song[]; currentSongIndex: number; isPlaying: boolean; currentTime: number } }
