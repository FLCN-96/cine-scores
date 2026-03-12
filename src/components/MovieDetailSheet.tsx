import { useState } from 'react'
import { useStore } from '../store'
import type { Movie } from '../types'
import { MoviePoster } from './MoviePoster'
import { RateMovieSheet } from './RateMovieSheet'
import { useAllMovieStats } from '../hooks/useMovieStats'
import { IconStar, IconCheck, IconCalendar, IconTrash, IconClose } from './Icons'

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
      <div className="sheet sheet--detail" onClick={e => e.stopPropagation()}>

        {/* Top bar: handle + close button */}
        <div className="sheet-topbar">
          <div className="sheet-handle" style={{ margin: 0 }} />
          <button className="sheet-close-btn" onClick={onClose} aria-label="Close">
            <IconClose size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="sheet-body">

          {/* Poster + meta */}
          <div className="sheet-movie-header">
            <MoviePoster posterUrl={movie.posterUrl} title={movie.title} size="lg" />
            <div className="sheet-movie-meta">
              <div className="sheet-movie-title">{movie.title}</div>
              <div className="sheet-movie-sub">
                {[movie.year, movie.genre].filter(Boolean).join(' · ')}
              </div>
              {stats.avg !== null && (
                <div className="sheet-movie-score">
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>{stats.avg}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    / 10 · {stats.count} rating{stats.count !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {movie.scheduledDate && !movie.watched && (
                <div className="movie-scheduled" style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconCalendar size={12} />
                  {formatDate(movie.scheduledDate)}
                </div>
              )}
              {movie.watched && (
                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <span className="movie-watched-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <IconCheck size={11} />
                    Watched
                  </span>
                </div>
              )}
            </div>
          </div>

          {movie.description && (
            <div className="sheet-description">{movie.description}</div>
          )}

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
            <button
              className="btn btn--ghost"
              style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setConfirmDelete(true)}
            >
              <IconTrash size={14} /> Delete Movie
            </button>
          )}
        </div>

        {/* Sticky footer: primary actions always visible */}
        <div className="sheet-footer">
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              className="btn btn--primary btn--full"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => setShowRate(true)}
            >
              <IconStar size={15} filled /> Rate This
            </button>
            {!movie.watched && (
              <button
                className="btn btn--secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => { markWatched(movie.id); onClose() }}
              >
                <IconCheck size={15} /> Watched
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
