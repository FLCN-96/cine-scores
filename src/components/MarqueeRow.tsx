import { IconFilm } from './Icons'
import type { TmdbDiscoveryMovie } from '../hooks/useTmdbDiscovery'

interface Props {
  title: string
  movies: TmdbDiscoveryMovie[]
  onMovieTap: (movie: TmdbDiscoveryMovie) => void
}

function formatShortDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ratingTier(score: number): string {
  if (score > 9) return ' marquee-card__rating--diamond'
  if (score >= 7.5) return ' marquee-card__rating--hot'
  if (score < 5) return ' marquee-card__rating--stinky'
  return ''
}

export function MarqueeRow({ title, movies, onMovieTap }: Props) {
  if (movies.length === 0) return null

  return (
    <div className="marquee-section">
      <div className="marquee-section__title">{title}</div>
      <div className="marquee-scroll">
        {movies.map(movie => (
          <div key={movie.id} className="marquee-card" onClick={() => onMovieTap(movie)}>
            {movie.poster_path ? (
              <img
                className="marquee-card__poster"
                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                alt={movie.title}
                loading="lazy"
              />
            ) : (
              <div className="marquee-card__poster marquee-card__placeholder">
                <IconFilm size={20} />
              </div>
            )}
            {movie.vote_average > 0 && (
              <div className={`marquee-card__rating${ratingTier(movie.vote_average)}`}>
                {movie.vote_average.toFixed(1)}
              </div>
            )}
            <div className="marquee-card__info">
              <div className="marquee-card__title">{movie.title}</div>
              {movie.release_date && (
                <div className="marquee-card__date">{formatShortDate(movie.release_date)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
