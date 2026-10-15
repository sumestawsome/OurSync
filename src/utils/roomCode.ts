/**
 * Smart-parser untuk mengekstrak dan membersihkan kode ruangan dari berbagai variasi input:
 * - URL lengkap Localhost: http://localhost:5173/room/LOVE-5411 -> LOVE-5411
 * - URL lengkap Vercel: https://our-sync-tau.vercel.app/room/LOVE-5411 -> LOVE-5411
 * - URL dengan trailing slash atau query: https://.../room/LOVE-5411/?ref=chat -> LOVE-5411
 * - Path parsial: /room/LOVE-5411 atau room/LOVE-5411 -> LOVE-5411
 * - Kode langsung lowercase: love-5411 -> LOVE-5411
 * - Kode dengan spasi: love 5411 -> LOVE-5411
 */
export function cleanRoomCode(input: string): string {
  if (!input) return ''

  let text = input.trim()

  // 1. Buang query parameters (?...) dan hash (#...)
  text = text.split('?')[0].split('#')[0].trim()

  // 2. Cek apakah ada pola /room/{kode}
  const roomPattern = /\/room\/([^/?#\s]+)/i
  const roomMatch = text.match(roomPattern)
  if (roomMatch && roomMatch[1]) {
    text = roomMatch[1]
  } else if (text.includes('://')) {
    // 3. URL lengkap tanpa /room/ (misal https://domain.com/LOVE-5411)
    try {
      const url = new URL(text)
      const segments = url.pathname.split('/').filter(Boolean)
      if (segments.length > 0) {
        text = segments[segments.length - 1]
      }
    } catch {
      const segments = text.split('/').filter(Boolean)
      if (segments.length > 0) {
        text = segments[segments.length - 1]
      }
    }
  } else if (text.includes('/')) {
    // 4. Ada slash tanpa protokol (misal: our-sync.vercel.app/room/LOVE-5411 atau /LOVE-5411)
    const segments = text.split('/').filter(Boolean)
    if (segments.length > 0) {
      text = segments[segments.length - 1]
    }
  }

  // 5. Bersihkan karakter non-alphanumeric di ujung (misal tanda petik, kurung)
  text = text.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')

  // 6. Konversi spasi di dalam kode menjadi strip (misal "LOVE 5411" -> "LOVE-5411")
  text = text.replace(/\s+/g, '-')

  // 7. Otomatis ubah menjadi huruf kapital (UPPERCASE)
  return text.toUpperCase()
}
