import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { sanitizeText } from '../utils/sanitizeText'

export interface TmdbDiscoveryMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  overview: string
  vote_average: number
  genre_ids: number[]
}

interface DiscoveryData {
  nowPlaying: TmdbDiscoveryMovie[]
  upcoming: TmdbDiscoveryMovie[]
}

const CACHE_KEY = 'cine-scores:tmdb-discovery'
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

function readCache(): DiscoveryData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; data: DiscoveryData }
    if (Date.now() - parsed.ts > CACHE_TTL) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(data: DiscoveryData) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch { /* ignore quota errors */ }
}

function sanitizeMovie(m: TmdbDiscoveryMovie): TmdbDiscoveryMovie {
  return { ...m, title: sanitizeText(m.title), overview: sanitizeText(m.overview ?? '') }
}

export function useTmdbDiscovery() {
  const tmdbApiKey = useStore(s => s.tmdbApiKey)
  const [data, setData] = useState<DiscoveryData>({ nowPlaying: [], upcoming: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tmdbApiKey) return

    const cached = readCache()
    if (cached) {
      setData(cached)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 45)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const currentYear = new Date().getFullYear()
    const upcomingCutoff = `${currentYear - 1}-01-01`

    Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${tmdbApiKey}&page=1&region=US`, { signal: controller.signal }).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${tmdbApiKey}&page=1&region=US`, { signal: controller.signal }).then(r => r.json()),
    ])
      .then(([npRes, upRes]) => {
        const nowPlaying: TmdbDiscoveryMovie[] = (npRes.results ?? [])
          .map(sanitizeMovie)
          .filter((m: TmdbDiscoveryMovie) => !m.release_date || m.release_date >= cutoffStr)
        const nowPlayingIds = new Set(nowPlaying.map(m => m.id))
        const upcoming: TmdbDiscoveryMovie[] = (upRes.results ?? [])
          .map(sanitizeMovie)
          .filter((m: TmdbDiscoveryMovie) => !nowPlayingIds.has(m.id))
          .filter((m: TmdbDiscoveryMovie) => !m.release_date || m.release_date >= upcomingCutoff)

        const result = { nowPlaying, upcoming }
        writeCache(result)
        setData(result)
      })
      .catch(() => { /* graceful degradation */ })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tmdbApiKey])

  return { ...data, loading }
}
