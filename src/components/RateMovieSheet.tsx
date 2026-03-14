import { useState } from 'react'
import { useStore } from '../store'
import { useSync } from '../hooks/useSync'
import type { Movie } from '../types'
import { MoviePoster } from './MoviePoster'
import { IconBack } from './Icons'

interface Props {
  movie: Movie
  onClose: () => void
}

export function RateMovieSheet({ movie, onClose }: Props) {
  const { addRating, deleteRating, ratings, activeUserId, users, censorUntilRated } = useStore()
  const { sync } = useSync()
  const existing = ratings.find(r => r.movieId === movie.id && r.userId === activeUserId)
  const [score, setScore] = useState(existing?.score ?? 7)
  const [hovered, setHovered] = useState<number | null>(null)
  const [review, setReview] = useState(existing?.review ?? '')
  const [saved, setSaved] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const activeUser = users.find(u => u.id === activeUserId)
  const displayScore = hovered ?? score

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeUserId) return
    addRating({ movieId: movie.id, userId: activeUserId, score, review })
    sync()
    setSaved(true)
    setTimeout(onClose, 1000)
  }

  function handleRemoveRating() {
    if (!existing) return
    deleteRating(existing.id)
    sync()
    onClose()
  }

  const scoreColor =
    displayScore >= 8 ? 'var(--color-success)' :
    displayScore >= 5 ? 'var(--color-accent)' :
    'var(--color-danger)'

  return (
    <div className="page-view">

      <div className="page-nav">
        <button className="page-nav__back" onClick={onClose}>
          <IconBack size={20} /> Back
        </button>
        <div className="page-nav__title">Rate Movie</div>
      </div>

      <div className="sheet-body">
        <form id="rate-movie-form" onSubmit={handleSubmit}>

          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <MoviePoster posterUrl={movie.posterUrl} title={movie.title} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{movie.title}</div>
              {movie.year && <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{movie.year}</div>}
            </div>
          </div>

          {!activeUser && (
            <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-md)' }}>
              Please select an active user in the Users tab first.
            </div>
          )}

          <div className="form-group">
            <label>Rating as {activeUser?.name ?? '—'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-xs)' }}>
              <div className="star-row">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <span
                    key={n}
                    className={`star${n <= displayScore ? ' filled' : ''}`}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setScore(n)}
                  >★</span>
                ))}
              </div>
              <div className="score-display" style={{ color: scoreColor, minWidth: 36 }}>
                {displayScore}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Review (optional)</label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="What did you think?"
            />
          </div>

        </form>

        {existing && (
          <div style={{ marginTop: 'var(--space-lg)' }}>
            {confirmRemove ? (
              <div className="confirm-row">
                <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-secondary)' }}>Remove your rating?</span>
                <button className="btn btn--secondary btn--sm" onClick={() => setConfirmRemove(false)}>Cancel</button>
                <button className="btn btn--danger btn--sm" onClick={handleRemoveRating}>Remove</button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ color: 'var(--color-danger)' }}
                onClick={() => setConfirmRemove(true)}
              >
                Remove My Rating
              </button>
            )}
          </div>
        )}

        <OtherRatings movieId={movie.id} excludeUserId={activeUserId ?? ''} censored={censorUntilRated && !existing} />
      </div>

      <div className="sheet-footer">
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button type="button" className="btn btn--secondary btn--full" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="rate-movie-form"
            className={`btn btn--full ${saved ? 'btn--saved' : 'btn--primary'}`}
            style={{ flex: 1 }}
            disabled={!activeUserId}
          >
            {saved ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Saved!
              </span>
            ) : existing ? 'Update Rating' : 'Save Rating'}
          </button>
        </div>
      </div>

    </div>
  )
}

function OtherRatings({ movieId, excludeUserId, censored }: { movieId: string; excludeUserId: string; censored: boolean }) {
  const { ratings, users } = useStore()
  const others = ratings.filter(r => r.movieId === movieId && r.userId !== excludeUserId)
  if (!others.length) return null

  if (censored) {
    return (
      <div style={{ marginTop: 'var(--space-xl)' }}>
        <div className="section-title">Friends' Ratings</div>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)', padding: 'var(--space-md) 0' }}>
          Rate this movie to see how your friends scored it.
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 'var(--space-xl)' }}>
      <div className="section-title">Friends' Ratings</div>
      {others.map(r => {
        const user = users.find(u => u.id === r.userId)
        return (
          <div key={r.id} className="row-item">
            <div
              className="avatar"
              style={{ background: user?.color ?? '#555', width: 32, height: 32, fontSize: 12 }}
            >
              {user?.name.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="row-item__body">
              <div className="row-item__title">{user?.name ?? 'Unknown'}</div>
              {r.review && <div className="row-item__subtitle">"{r.review}"</div>}
            </div>
            <div style={{
              fontWeight: 800,
              fontSize: 20,
              color: r.score >= 8 ? 'var(--color-success)' : r.score >= 5 ? 'var(--color-accent)' : 'var(--color-danger)'
            }}>
              {r.score}
            </div>
          </div>
        )
      })}
    </div>
  )
}
