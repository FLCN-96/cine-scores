import { useState } from 'react'
import { useStore } from '../store'
import { MoviePoster } from './MoviePoster'
import { IconBack, IconStar } from './Icons'

interface Props {
  onClose: () => void
}

export function UserRatingsSheet({ onClose }: Props) {
  const { ratings, movies, deleteRating, activeUserId, users } = useStore()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const activeUser = users.find(u => u.id === activeUserId)
  const myRatings = ratings.filter(r => r.userId === activeUserId)

  function handleDelete(ratingId: string) {
    deleteRating(ratingId)
    setConfirmDeleteId(null)
  }

  return (
    <div className="page-view">
      <div className="page-nav">
        <button className="page-nav__back" onClick={onClose}>
          <IconBack size={20} /> Back
        </button>
        <div className="page-nav__title">My Ratings</div>
      </div>

      <div className="sheet-body">
        {myRatings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><IconStar size={44} /></div>
            <div className="empty-state__text">
              {activeUser ? `${activeUser.name} hasn't rated any movies yet.` : 'No active user selected.'}
            </div>
          </div>
        ) : (
          <div className="section">
            <div className="section-title">{activeUser?.name ?? 'My'} Ratings ({myRatings.length})</div>
            {myRatings.map(r => {
              const movie = movies.find(m => m.id === r.movieId)
              const scoreColor =
                r.score >= 8 ? 'var(--color-success)' :
                r.score >= 5 ? 'var(--color-accent)' :
                'var(--color-danger)'
              return (
                <div key={r.id} className="row-item" style={{ alignItems: 'flex-start' }}>
                  <MoviePoster posterUrl={movie?.posterUrl ?? ''} title={movie?.title ?? 'Unknown'} size="sm" />
                  <div className="row-item__body">
                    <div className="row-item__title">{movie?.title ?? 'Unknown Movie'}</div>
                    {movie?.year && (
                      <div className="row-item__subtitle">{movie.year}</div>
                    )}
                    {r.review && (
                      <div className="row-item__subtitle" style={{ marginTop: 4 }}>"{r.review}"</div>
                    )}
                    <div style={{ marginTop: 'var(--space-sm)' }}>
                      {confirmDeleteId === r.id ? (
                        <div className="confirm-row" style={{ margin: 0 }}>
                          <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-secondary)' }}>Remove rating?</span>
                          <button className="btn btn--secondary btn--sm" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                          <button className="btn btn--danger btn--sm" onClick={() => handleDelete(r.id)}>Remove</button>
                        </div>
                      ) : (
                        <button
                          className="btn btn--ghost btn--sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => setConfirmDeleteId(r.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 24, color: scoreColor, flexShrink: 0 }}>
                    {r.score}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="sheet-footer">
        <button className="btn btn--secondary btn--full" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
