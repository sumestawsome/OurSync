/**
 * Ekstraksi YouTube Video ID dari berbagai format URL atau ID mentah
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null
  const trimmed = urlOrId.trim()

  // Jika input sudah merupakan ID 11 karakter standar YouTube
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  // Pola regex komprehensif untuk tautan youtube.com, youtu.be, shorts, embed
  const regExp =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = trimmed.match(regExp)

  return match && match[1] ? match[1] : null
}

/**
 * Dapatkan URL gambar thumbnail YouTube beresolusi tinggi
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
