import { supabase } from '../lib/supabaseClient'
import type { Song } from '../types'
import { initialPlaylist } from '../data/mockData'

/**
 * Mengambil playlist pribadi milik pengguna dari Supabase (tabel user_playlists)
 * dengan fallback ke localStorage.
 */
export async function getPersonalPlaylist(userId: string): Promise<Song[]> {
  if (!userId) return []

  try {
    const { data, error } = await supabase
      .from('user_playlists')
      .select('playlist')
      .eq('user_id', userId)
      .maybeSingle()

    if (data && !error && Array.isArray(data.playlist) && data.playlist.length > 0) {
      return data.playlist
    }
  } catch (err) {
    console.warn('Gagal fetch user_playlists dari Supabase:', err)
  }

  // Fallback ke localStorage
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`oursync_playlist_${userId}`)
      if (local) {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
  }

  // Jika belum ada playlist sama sekali, sediakan 2 lagu favorit default
  return initialPlaylist.slice(0, 3)
}

/**
 * Menyimpan playlist pribadi milik pengguna ke Supabase dan localStorage
 */
export async function savePersonalPlaylist(userId: string, playlist: Song[]): Promise<void> {
  if (!userId) return

  // Simpan ke localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`oursync_playlist_${userId}`, JSON.stringify(playlist))
    } catch {
      // ignore
    }
  }

  // Simpan ke Supabase tabel user_playlists
  try {
    await supabase.from('user_playlists').upsert({
      user_id: userId,
      playlist,
      updated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('Gagal upsert user_playlists ke Supabase:', err)
  }
}
