import { useState } from 'react'
import { useStore } from '../store'
import type { Movie } from '../types'
import { MoviePoster } from './MoviePoster'
import { RateMovieSheet } from './RateMovieSheet'
import { ScheduleSheet } from './ScheduleSheet'
import { useAllMovieStats } from '../hooks/useMovieStats'
import { IconStar, IconCheck, IconCalendar, IconTrash, IconBack } from './Icons'

function IconPencil({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

interface Props {
  movie: Movie
  onClose: () => void
}

const TODAY = new Date().toISOString().split('T')[0]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function MovieDetailSheet({ movie, onClose }: Props) {
  const { deleteMovie, deleteRating, markWatched, markUnwatched, toggleAttendance, users, ratings, movies, activeUserId } = useStore()
  const [showRate, setShowRate] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showEditRelease, setShowEditRelease] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmRemoveRating, setConfirmRemoveRating] = useState(false)
  const statsMap = useAllMovieStats(movies, ratings)

  const liveMovie = movies.find(m => m.id === movie.id) ?? movie
  const stats = statsMap[liveMovie.id]
  const attendees = liveMovie.attendees ?? []
  const interestedUsers = liveMovie.interestedUsers ?? []
  const iAmGoing = activeUserId ? attendees.includes(activeUserId) : false

  const myRating = activeUserId ? ratings.find(r => r.movieId === liveMovie.id && r.userId === activeUserId) : null

  if (showRate) {
    return <RateMovieSheet movie={liveMovie} onClose={() => setShowRate(false)} />
  }
  if (showSchedule) {
    return <ScheduleSheet movie={liveMovie} onClose={() => setShowSchedule(false)} />
  }
  if (showEditRelease) {
    return <ScheduleSheet movie={liveMovie} mode="release" onClose={() => setShowEditRelease(false)} />
  }

  const movieRatings = ratings.filter(r => r.movieId === liveMovie.id)

  const isAvailableNow = !liveMovie.watched && !liveMovie.scheduledDate && liveMovie.releaseDate && liveMovie.releaseDate <= TODAY

  function handleMarkWatched() {
    markWatched(liveMovie.id)
    setShowRate(true)
  }

  return (
    <div className="page-view">

      <div className="page-nav">
        <button className="page-nav__back" onClick={onClose}>
          <IconBack size={20} /> Back
        </button>
        <div className="page-nav__title">{liveMovie.title}</div>
      </div>

      <div className="sheet-body">

        <div className="sheet-movie-header">
          <MoviePoster posterUrl={liveMovie.posterUrl} title={liveMovie.title} size="lg" />
          <div className="sheet-movie-meta">
            <div className="sheet-movie-title">{liveMovie.title}</div>
            <div className="sheet-movie-sub">
              {[liveMovie.year, liveMovie.genre].filter(Boolean).join(' · ')}
            </div>
            {stats.avg !== null && (
              <div className="sheet-movie-score">
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>{stats.avg}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  / 10 · {stats.count} rating{stats.count !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {liveMovie.releaseDate && !liveMovie.watched && (
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {isAvailableNow ? (
                  <span className="badge badge--available">Now Available</span>
                ) : (
                  <div className="movie-scheduled" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconCalendar size={12} />
                    <span style={{ fontSize: 12 }}>Out {formatDate(liveMovie.releaseDate)}</span>
                  </div>
                )}
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ padding: '2px 4px', color: 'var(--color-text-muted)' }}
                  onClick={() => setShowEditRelease(true)}
                  title="Edit release date"
                >
                  <IconPencil size={12} />
                </button>
              </div>
            )}
            {liveMovie.scheduledDate && !liveMovie.watched && (
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="movie-scheduled" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconCalendar size={12} />
                  {formatDate(liveMovie.scheduledDate)}
                </div>
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ padding: '2px 4px', color: 'var(--color-text-muted)' }}
                  onClick={() => setShowSchedule(true)}
                  title="Reschedule"
                >
                  <IconPencil size={12} />
                </button>
              </div>
            )}
            {liveMovie.watched && (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <span className="movie-watched-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconCheck size={11} />
                  Watched
                </span>
              </div>
            )}
          </div>
        </div>

        {liveMovie.description && (
          <div className="sheet-description">{liveMovie.description}</div>
        )}

        {!liveMovie.watched && (
          <div style={{ marginBottom: 'var(--space-md)' }}>
            {/* Interested users — show on all non-watched movies */}
            {interestedUsers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginRight: 2 }}>Interested:</span>
                {interestedUsers.map(uid => {
                  const u = users.find(u => u.id === uid)
                  return u ? (
                    <div key={uid} title={u.name} className="avatar" style={{ background: u.color, width: 28, height: 28, fontSize: 12 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  ) : null
                })}
              </div>
            )}

            {/* Attending users — show only for scheduled movies */}
            {liveMovie.scheduledDate && attendees.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginRight: 2 }}>Going:</span>
                {attendees.map(uid => {
                  const u = users.find(u => u.id === uid)
                  return u ? (
                    <div key={uid} title={u.name} className="avatar" style={{ background: u.color, width: 28, height: 28, fontSize: 12 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>
        )}

        {movieRatings.length > 0 && (
          <div>
            <div className="section-title">All Ratings</div>
            {movieRatings.map(r => {
              const user = users.find(u => u.id === r.userId)
              const isMyRating = r.userId === activeUserId
              return (
                <div key={r.id} className="row-item">
                  <div className="avatar" style={{ background: user?.color ?? '#555', width: 32, height: 32, fontSize: 12 }}>
                    {user?.name.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="row-item__body">
                    <div className="row-item__title">{user?.name ?? 'Unknown'}</div>
                    {r.review && <div className="row-item__subtitle">"{r.review}"</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{
                      fontWeight: 800, fontSize: 22,
                      color: r.score >= 8 ? 'var(--color-success)' : r.score >= 5 ? 'var(--color-accent)' : 'var(--color-danger)'
                    }}>
                      {r.score}
                    </div>
                    {isMyRating && (
                      confirmRemoveRating ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn--secondary btn--sm" style={{ fontSize: 11 }} onClick={() => setConfirmRemoveRating(false)}>Cancel</button>
                          <button className="btn btn--danger btn--sm" style={{ fontSize: 11 }} onClick={() => { deleteRating(r.id); setConfirmRemoveRating(false) }}>Remove</button>
                        </div>
                      ) : (
                        <button
                          className="btn btn--ghost btn--sm"
                          style={{ fontSize: 11, color: 'var(--color-danger)' }}
                          onClick={() => setConfirmRemoveRating(true)}
                        >
                          Remove
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="divider" />

        {confirmDelete ? (
          <div className="confirm-row">
            <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              Delete this movie and all its ratings?
            </span>
            <button className="btn btn--secondary btn--sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn btn--danger btn--sm" onClick={() => { deleteMovie(liveMovie.id); onClose() }}>Delete</button>
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

      <div className="sheet-footer">
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            className="btn btn--primary btn--full"
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => myRating ? setShowRate(true) : setShowRate(true)}
          >
            <IconStar size={15} filled /> {myRating ? 'Edit Rating' : 'Rate This'}
          </button>
          {!liveMovie.watched && liveMovie.scheduledDate && (
            <button
              className="btn btn--full"
              style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text)',
                opacity: iAmGoing ? 0.5 : 1,
              }}
              onClick={() => toggleAttendance(liveMovie.id)}
            >
              <IconCheck size={15} /> {iAmGoing ? 'Going ✓' : "I'm Going"}
            </button>
          )}
          {!liveMovie.watched && (
            <button
              className="btn btn--full"
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
              onClick={handleMarkWatched}
            >
              <IconCheck size={15} /> Watched
            </button>
          )}
          {liveMovie.watched && (
            <button
              className="btn btn--full"
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-muted)' }}
              onClick={() => markUnwatched(liveMovie.id)}
            >
              Unwatch
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
