import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { IconBack, IconFilm } from './Icons'
import type { TmdbDiscoveryMovie } from '../hooks/useTmdbDiscovery'

interface Props {
  movie: TmdbDiscoveryMovie
  onClose: () => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function useTrailer(tmdbId: number) {
  const tmdbApiKey = useStore(s => s.tmdbApiKey)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tmdbApiKey) return
    const controller = new AbortController()
    setLoading(true)

    fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${tmdbApiKey}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        const trailer = (data.results ?? []).find(
          (v: { type: string; site: string }) => v.type === 'Trailer' && v.site === 'YouTube'
        )
        if (trailer) {
          setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tmdbId, tmdbApiKey])

  return { trailerUrl, loading }
}

export function DiscoveryPreviewSheet({ movie, onClose }: Props) {
  const { trailerUrl, loading: trailerLoading } = useTrailer(movie.id)

  const scoreColor =
    movie.vote_average >= 7 ? 'var(--color-success)' :
    movie.vote_average >= 5 ? 'var(--color-accent)' :
    'var(--color-danger)'

  return (
    <div className="page-view">
      <div className="page-nav">
        <button className="page-nav__back" onClick={onClose}>
          <IconBack size={20} /> Back
        </button>
        <div className="page-nav__title">{movie.title}</div>
      </div>

      <div className="sheet-body">
        <div className="sheet-movie-header">
          <div className="discovery-poster-wrap">
            {movie.poster_path ? (
              <img
                className="discovery-poster"
                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                alt={movie.title}
              />
            ) : (
              <div className="discovery-poster discovery-poster--placeholder">
                <IconFilm size={32} />
              </div>
            )}
          </div>
          <div className="sheet-movie-meta">
            <div className="sheet-movie-title">{movie.title}</div>
            {movie.release_date && (
              <div className="sheet-movie-sub">{formatDate(movie.release_date)}</div>
            )}
            {movie.vote_average > 0 && (
              <div className="sheet-movie-score">
                <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor }}>
                  {movie.vote_average.toFixed(1)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>/ 10</span>
              </div>
            )}
          </div>
        </div>

        {movie.overview && (
          <div className="sheet-description">{movie.overview}</div>
        )}
      </div>

      {(trailerUrl || trailerLoading) && (
        <div className="sheet-footer">
          {trailerUrl ? (
            <a
              href={trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
            >
              ▶ Watch Trailer
            </a>
          ) : (
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', padding: 'var(--space-sm) 0' }}>
              Finding trailer...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
