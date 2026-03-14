import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { MoviePoster } from '../components/MoviePoster'
import { MovieDetailSheet } from '../components/MovieDetailSheet'
import { RateMovieSheet } from '../components/RateMovieSheet'
import { IconStar } from '../components/Icons'
import type { Movie } from '../types'

export function Ratings() {
  const { movies, ratings, users, activeUserId, censorUntilRated } = useStore()
  const [selected, setSelected] = useState<Movie | null>(null)
  const [ratingMovie, setRatingMovie] = useState<Movie | null>(null)
  const [filterUserId, setFilterUserId] = useState<string>('all')

  // "All" view: movies that are watched OR have any rating
  const allViewMovies = useMemo(() =>
    movies.filter(m => m.watched || ratings.some(r => r.movieId === m.id)),
    [movies, ratings]
  )

  // User view: watched movies + movies that user has rated
  const userViewMovies = useMemo(() => {
    if (filterUserId === 'all') return allViewMovies
    const userRatedIds = new Set(ratings.filter(r => r.userId === filterUserId).map(r => r.movieId))
    return movies.filter(m => m.watched || userRatedIds.has(m.id))
  }, [filterUserId, movies, ratings, allViewMovies])

  const moviesWithStats = useMemo(() => {
    return userViewMovies.map(m => {
      const mrs = filterUserId === 'all'
        ? ratings.filter(r => r.movieId === m.id)
        : ratings.filter(r => r.movieId === m.id && r.userId === filterUserId)
      const avg = mrs.length ? mrs.reduce((s, r) => s + r.score, 0) / mrs.length : null
      return { movie: m, avg: avg !== null ? Math.round(avg * 10) / 10 : null, count: mrs.length }
    }).sort((a, b) => {
      // Rated first (by score desc), then unrated alphabetically
      if (a.avg !== null && b.avg !== null) return b.avg - a.avg
      if (a.avg !== null) return -1
      if (b.avg !== null) return 1
      return a.movie.title.localeCompare(b.movie.title)
    })
  }, [userViewMovies, ratings, filterUserId])

  const ratedByMe = useMemo(() =>
    new Set(ratings.filter(r => r.userId === activeUserId).map(r => r.movieId)),
    [ratings, activeUserId]
  )

  const isMyFilter = filterUserId === activeUserId

  return (
    <div className="app-content">
      <div className="page">
        <div className="page-header">
          <div className="page-title">Ratings</div>
        </div>

        <div className="chip-row">
          <button
            className={`chip${filterUserId === 'all' ? ' active' : ''}`}
            onClick={() => setFilterUserId('all')}
          >
            All
          </button>
          {users.map(u => (
            <button
              key={u.id}
              className={`chip${filterUserId === u.id ? ' active' : ''}`}
              onClick={() => setFilterUserId(u.id)}
              style={filterUserId === u.id ? { borderColor: u.color, color: u.color, background: `${u.color}22` } : {}}
            >
              {u.name}
            </button>
          ))}
        </div>

        {moviesWithStats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><IconStar size={44} /></div>
            <div className="empty-state__text">No ratings yet.<br />Watch some movies and rate them!</div>
          </div>
        ) : (
          <div className="section">
            {moviesWithStats.map(({ movie, avg, count }, idx) => {
              const showRateBtn = isMyFilter && activeUserId && !ratedByMe.has(movie.id)
              const isCensored = censorUntilRated && !ratedByMe.has(movie.id)
              const ranked = avg !== null && filterUserId === 'all' && !isCensored
              const displayAvg = isCensored ? null : avg
              const censoredHasScores = isCensored && avg !== null
              return (
                <div key={movie.id} className="movie-card" onClick={() => setSelected(movie)}>
                  {ranked && (
                    <div className={`rank rank--${idx + 1}`} style={{ fontSize: 15 }}>
                      {idx < 3 ? idx + 1 : ''}
                    </div>
                  )}
                  <MoviePoster posterUrl={movie.posterUrl} title={movie.title} size="sm" />
                  <div className="movie-info">
                    <div className="movie-title">{movie.title}</div>
                    <div className="movie-meta">
                      {[movie.year, movie.genre].filter(Boolean).join(' · ')}
                    </div>
                    {filterUserId === 'all' && !isCensored && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {count} rating{count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: displayAvg !== null ? 24 : 18,
                      color: censoredHasScores ? 'var(--color-text-muted)' :
                        displayAvg === null ? 'var(--color-text-muted)' :
                        displayAvg >= 8 ? 'var(--color-success)' :
                        displayAvg >= 5 ? 'var(--color-accent)' :
                        'var(--color-danger)'
                    }}>
                      {censoredHasScores ? '?' : (displayAvg ?? '—')}
                    </div>
                    {showRateBtn && (
                      <button
                        className="btn btn--sm btn--ghost"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)' }}
                        onClick={e => { e.stopPropagation(); setRatingMovie(movie) }}
                      >
                        <IconStar size={13} filled /> Rate
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filterUserId === 'all' && users.length > 1 && ratings.length > 0 && !censorUntilRated && (
          <UserBreakdown />
        )}
      </div>

      {selected && <MovieDetailSheet movie={selected} onClose={() => setSelected(null)} />}
      {ratingMovie && <RateMovieSheet movie={ratingMovie} onClose={() => setRatingMovie(null)} />}
    </div>
  )
}

function UserBreakdown() {
  const { users, ratings } = useStore()

  const userStats = useMemo(() => {
    return users.map(u => {
      const urs = ratings.filter(r => r.userId === u.id)
      const avg = urs.length ? urs.reduce((s, r) => s + r.score, 0) / urs.length : null
      return { user: u, count: urs.length, avg: avg !== null ? Math.round(avg * 10) / 10 : null }
    }).sort((a, b) => b.count - a.count)
  }, [users, ratings])

  return (
    <div className="section">
      <div className="section-title">By Person</div>
      {userStats.map(({ user, count, avg }) => (
        <div key={user.id} className="row-item">
          <div className="avatar" style={{ background: user.color }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="row-item__body">
            <div className="row-item__title">{user.name}</div>
            <div className="row-item__subtitle">{count} rating{count !== 1 ? 's' : ''}</div>
          </div>
          {avg !== null && (
            <div style={{
              fontWeight: 800, fontSize: 20,
              color: avg >= 8 ? 'var(--color-success)' : avg >= 5 ? 'var(--color-accent)' : 'var(--color-danger)'
            }}>
              {avg} avg
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
