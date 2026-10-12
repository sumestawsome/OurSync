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
  | { type: 'REORDER_QUEUE'; payload: { queue: Song[] } }
  | { type: 'SEND_LOVE'; payload: { sender: string; timestamp: number } }
  | { type: 'CHAT_MESSAGE'; payload: { sender: string; message: string; timestamp: number } }
