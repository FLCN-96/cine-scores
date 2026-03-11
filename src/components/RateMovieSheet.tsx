import { useState } from 'react'
import { useStore } from '../store'
import type { Movie } from '../types'
import { MoviePoster } from './MoviePoster'

interface Props {
  movie: Movie
  onClose: () => void
}

export function RateMovieSheet({ movie, onClose }: Props) {
  const { addRating, ratings, activeUserId, users } = useStore()
  const existing = ratings.find(r => r.movieId === movie.id && r.userId === activeUserId)
  const [score, setScore] = useState(existing?.score ?? 7)
  const [review, setReview] = useState(existing?.review ?? '')
  const [saved, setSaved] = useState(false)

  const activeUser = users.find(u => u.id === activeUserId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeUserId) return
    addRating({ movieId: movie.id, userId: activeUserId, score, review })
    setSaved(true)
    setTimeout(onClose, 1000)
  }

  const scoreColor =
    score >= 8 ? 'var(--color-success)' :
    score >= 5 ? 'var(--color-accent)' :
    'var(--color-danger)'

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rating as {activeUser?.name ?? '—'}</label>
            <div className="score-slider-row">
              <input
                type="range"
                min={1}
                max={10}
                value={score}
                onChange={e => setScore(Number(e.target.value))}
              />
              <div className="score-display" style={{ color: scoreColor }}>
                {score}
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
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button type="button" className="btn btn--secondary btn--full" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn--full ${saved ? 'btn--saved' : 'btn--primary'}`}
              disabled={!activeUserId}
            >
              {saved ? '✓ Saved!' : existing ? 'Update Rating' : 'Save Rating'}
            </button>
          </div>
        </form>

        {/* Other ratings */}
        <OtherRatings movieId={movie.id} excludeUserId={activeUserId ?? ''} />
      </div>
    </div>
  )
}

function OtherRatings({ movieId, excludeUserId }: { movieId: string; excludeUserId: string }) {
  const { ratings, users } = useStore()
  const others = ratings.filter(r => r.movieId === movieId && r.userId !== excludeUserId)
  if (!others.length) return null

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
