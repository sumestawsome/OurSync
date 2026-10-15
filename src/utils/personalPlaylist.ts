import { supabase } from '../lib/supabaseClient'
import type { Song } from '../types'

/**
 * Helper untuk menentukan key penyimpanan lokal terisolasi:
 * - Pengguna Google Auth: 'oursync_lib_user_${userId}'
 * - Pengguna Guest/Tamu: 'oursync_lib_guest_${guestId}'
 */
export function getPersonalStorageKey(userId: string, isGoogleUser: boolean = false): string {
  if (!userId) return 'oursync_lib_guest_default'
  if (isGoogleUser) {
    return `oursync_lib_user_${userId}`
  }
  const cleanGuestId = userId.startsWith('guest_') ? userId.replace('guest_', '') : userId
  return `oursync_lib_guest_${cleanGuestId}`
}

/**
 * Memuat koleksi playlist pribadi pengguna (Pure CRUD):
 * - Jika login dengan Google: ambil dari Supabase tabel user_playlists (dengan cache lokal terisolasi).
 * - Jika Guest (tamu): ambil dari localStorage dengan key terisolasi.
 * - Dilengkapi migrasi otomatis dari key lama (oursync_playlist_${userId}) agar data lama tidak hilang.
 * - Tidak berinteraksi atau terpengaruh oleh antrean room apa pun.
 */
export async function loadPersonalPlaylist(userId: string, isGoogleUser: boolean = false): Promise<Song[]> {
  if (!userId) return []

  const storageKey = getPersonalStorageKey(userId, isGoogleUser)

  // 1. Jika pengguna login dengan akun Google, ambil dari database Supabase
  if (isGoogleUser) {
    try {
      const { data, error } = await supabase
        .from('user_playlists')
        .select('playlist')
        .eq('user_id', userId)
        .maybeSingle()

      if (data && !error && Array.isArray(data.playlist) && data.playlist.length > 0) {
        // Cache ke localStorage terisolasi untuk performa & akses offline
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(data.playlist))
          } catch {
            // ignore
          }
        }
        return data.playlist
      }
    } catch (err) {
      console.warn('Gagal fetch user_playlists dari Supabase:', err)
    }
  }

  // 2. Baca dari localStorage dengan key terisolasi
  if (typeof window !== 'undefined') {
    try {
      let local = localStorage.getItem(storageKey)
      // Fallback migrasi jika key baru belum ada namun ada data di key lama
      if (!local) {
        const legacyKey = `oursync_playlist_${userId}`
        const legacyData = localStorage.getItem(legacyKey)
        if (legacyData) {
          local = legacyData
          localStorage.setItem(storageKey, legacyData)
        }
      }

      if (local) {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Jika user login Google tapi Supabase belum ada data, sinkronkan data lokal ke Supabase
          if (isGoogleUser) {
            savePersonalPlaylist(userId, parsed, true).catch(() => {})
          }
          return parsed
        }
      }
    } catch {
      // ignore
    }
  }

  return []
}

/**
 * Alias getPersonalPlaylist untuk menjaga backward compatibility
 */
export const getPersonalPlaylist = loadPersonalPlaylist

/**
 * Menyimpan koleksi playlist pribadi milik pengguna (Pure CRUD):
 * - Jika Guest: simpan di localStorage dengan key terisolasi 'oursync_lib_guest_${guestId}'.
 * - Jika login Google: simpan di Supabase tabel user_playlists dan cache di 'oursync_lib_user_${userId}'.
 * - DILARANG KERAS berinteraksi atau mengubah tabel rooms / antrean room.
 */
export async function savePersonalPlaylist(userId: string, playlist: Song[], isGoogleUser: boolean = false): Promise<void> {
  if (!userId) return

  const storageKey = getPersonalStorageKey(userId, isGoogleUser)

  // Selalu simpan di localStorage terisolasi
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(storageKey, JSON.stringify(playlist))
    } catch {
      // ignore
    }
  }

  // Jika login dengan Google, simpan persisten ke Supabase agar dapat diakses lintas perangkat
  if (isGoogleUser) {
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
}

/**
 * Menambahkan satu lagu ke playlist pribadi pengguna tanpa duplikasi
 */
export async function addSongToPersonalPlaylist(
  userId: string,
  song: Song,
  isGoogleUser: boolean = false
): Promise<Song[]> {
  const current = await loadPersonalPlaylist(userId, isGoogleUser)
  const isAlreadyAdded = current.some((s) => s.id === song.id || (s.videoId && s.videoId === song.videoId))
  if (isAlreadyAdded) return current

  const updated = [...current, song]
  await savePersonalPlaylist(userId, updated, isGoogleUser)
  return updated
}

/**
 * Menghapus satu lagu dari playlist pribadi pengguna
 */
export async function removeSongFromPersonalPlaylist(
  userId: string,
  songId: string,
  isGoogleUser: boolean = false
): Promise<Song[]> {
  const current = await loadPersonalPlaylist(userId, isGoogleUser)
  const updated = current.filter((s) => s.id !== songId)
  await savePersonalPlaylist(userId, updated, isGoogleUser)
  return updated
}


