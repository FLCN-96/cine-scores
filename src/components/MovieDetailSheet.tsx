import { useState } from 'react'
import { useStore } from '../store'
import type { Movie } from '../types'
import { MoviePoster } from './MoviePoster'
import { RateMovieSheet } from './RateMovieSheet'
import { useAllMovieStats } from '../hooks/useMovieStats'

interface Props {
  movie: Movie
  onClose: () => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function MovieDetailSheet({ movie, onClose }: Props) {
  const { deleteMovie, markWatched, users, ratings, movies } = useStore()
  const [showRate, setShowRate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const statsMap = useAllMovieStats(movies, ratings)
  const stats = statsMap[movie.id]

  if (showRate) {
    return <RateMovieSheet movie={movie} onClose={() => setShowRate(false)} />
  }

  const movieRatings = ratings.filter(r => r.movieId === movie.id)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <MoviePoster posterUrl={movie.posterUrl} title={movie.title} size="lg" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{movie.title}</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
              {[movie.year, movie.genre].filter(Boolean).join(' · ')}
            </div>
            {stats.avg !== null && (
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>{stats.avg}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>/ 10 · {stats.count} rating{stats.count !== 1 ? 's' : ''}</span>
              </div>
            )}
            {movie.scheduledDate && !movie.watched && (
              <div className="movie-scheduled" style={{ marginTop: 'var(--space-sm)' }}>
                📅 {formatDate(movie.scheduledDate)}
              </div>
            )}
            {movie.watched && (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <span className="movie-watched-badge">✓ Watched</span>
              </div>
            )}
          </div>
        </div>

        {movie.description && (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
            {movie.description}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <button className="btn btn--primary btn--full" onClick={() => setShowRate(true)}>
            ⭐ Rate This
          </button>
          {!movie.watched && (
            <button className="btn btn--secondary" onClick={() => { markWatched(movie.id); onClose() }}>
              ✓ Watched
            </button>
          )}
        </div>

        {movieRatings.length > 0 && (
          <div>
            <div className="section-title">All Ratings</div>
            {movieRatings.map(r => {
              const user = users.find(u => u.id === r.userId)
              return (
                <div key={r.id} className="row-item">
                  <div className="avatar" style={{ background: user?.color ?? '#555', width: 32, height: 32, fontSize: 12 }}>
                    {user?.name.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="row-item__body">
                    <div className="row-item__title">{user?.name ?? 'Unknown'}</div>
                    {r.review && <div className="row-item__subtitle">"{r.review}"</div>}
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: 22,
                    color: r.score >= 8 ? 'var(--color-success)' : r.score >= 5 ? 'var(--color-accent)' : 'var(--color-danger)'
                  }}>
                    {r.score}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="divider" />

        {confirmDelete ? (
          <div className="confirm-row">
            <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-secondary)' }}>Delete this movie?</span>
            <button className="btn btn--secondary btn--sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn btn--danger btn--sm" onClick={() => { deleteMovie(movie.id); onClose() }}>Delete</button>
          </div>
        ) : (
          <button className="btn btn--ghost" style={{ color: 'var(--color-danger)' }} onClick={() => setConfirmDelete(true)}>
            Delete Movie
          </button>
        )}
      </div>
    </div>
  )
}
