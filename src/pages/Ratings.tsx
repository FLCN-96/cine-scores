import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { MoviePoster } from '../components/MoviePoster'
import { MovieDetailSheet } from '../components/MovieDetailSheet'
import { IconStar } from '../components/Icons'
import type { Movie } from '../types'

export function Ratings() {
  const { movies, ratings, users } = useStore()
  const [selected, setSelected] = useState<Movie | null>(null)
  const [filterUserId, setFilterUserId] = useState<string>('all')

  const watchedMovies = useMemo(() =>
    movies.filter(m => m.watched || ratings.some(r => r.movieId === m.id)),
    [movies, ratings]
  )

  const moviesWithStats = useMemo(() => {
    return watchedMovies.map(m => {
      const mrs = filterUserId === 'all'
        ? ratings.filter(r => r.movieId === m.id)
        : ratings.filter(r => r.movieId === m.id && r.userId === filterUserId)
      const avg = mrs.length ? mrs.reduce((s, r) => s + r.score, 0) / mrs.length : null
      return { movie: m, avg: avg !== null ? Math.round(avg * 10) / 10 : null, count: mrs.length }
    }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1))
  }, [watchedMovies, ratings, filterUserId])

  return (
    <div className="app-content">
      <div className="page">
        <div className="page-header">
          <div className="page-title">Ratings</div>
        </div>

        {/* User filter */}
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
            {moviesWithStats.map(({ movie, avg, count }, idx) => (
              <div key={movie.id} className="movie-card" onClick={() => setSelected(movie)}>
                <div className={`rank rank--${idx + 1}`} style={{ fontSize: 15 }}>
                  {idx < 3 ? idx + 1 : ''}
                </div>
                <MoviePoster posterUrl={movie.posterUrl} title={movie.title} size="sm" />
                <div className="movie-info">
                  <div className="movie-title">{movie.title}</div>
                  <div className="movie-meta">
                    {[movie.year, movie.genre].filter(Boolean).join(' · ')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {count} rating{count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{
                  fontWeight: 800,
                  fontSize: avg !== null ? 24 : 18,
                  color: avg === null ? 'var(--color-text-muted)' :
                    avg >= 8 ? 'var(--color-success)' :
                    avg >= 5 ? 'var(--color-accent)' :
                    'var(--color-danger)'
                }}>
                  {avg ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Per-user breakdown if viewing all */}
        {filterUserId === 'all' && users.length > 1 && ratings.length > 0 && (
          <UserBreakdown />
        )}
      </div>

      {selected && <MovieDetailSheet movie={selected} onClose={() => setSelected(null)} />}
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
