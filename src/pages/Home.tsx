import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { MoviePoster } from '../components/MoviePoster'
import { MovieDetailSheet } from '../components/MovieDetailSheet'
import { RateMovieSheet } from '../components/RateMovieSheet'
import { IconFilm, IconCalendar, IconStar, IconAttend } from '../components/Icons'
import type { Movie } from '../types'

const TODAY = new Date().toISOString().split('T')[0]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function Home() {
  const { movies, users, ratings, activeUserId, toggleAttendance, updateMovie } = useStore()
  const [selected, setSelected] = useState<Movie | null>(null)
  const [ratingMovie, setRatingMovie] = useState<Movie | null>(null)

  const activeUser = users.find(u => u.id === activeUserId)

  const { rateThese, comingUp, proposed } = useMemo(() => {
    const unwatched = movies.filter(m => !m.watched)
    const ratedMovieIds = new Set(
      ratings.filter(r => r.userId === activeUserId).map(r => r.movieId)
    )

    const rateThese = unwatched.filter(m =>
      m.scheduledDate &&
      m.scheduledDate < TODAY &&
      activeUserId &&
      (m.attendees ?? []).includes(activeUserId) &&
      !ratedMovieIds.has(m.id)
    ).sort((a, b) => new Date(b.scheduledDate!).getTime() - new Date(a.scheduledDate!).getTime())

    const comingUp = unwatched.filter(m =>
      m.scheduledDate && m.scheduledDate >= TODAY
    ).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())

    const proposed = unwatched.filter(m =>
      !m.scheduledDate
    ).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

    return { rateThese, comingUp, proposed }
  }, [movies, ratings, activeUserId])

  const watchedCount = movies.filter(m => m.watched).length
  const totalMovies = movies.length
  const totalRatings = ratings.length

  function AttendButton({ movie }: { movie: Movie }) {
    const going = activeUserId ? (movie.attendees ?? []).includes(activeUserId) : false
    return (
      <button
        className={`btn btn--sm${going ? ' btn--secondary' : ' btn--ghost'}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
          color: going ? undefined : 'var(--color-text-secondary)',
        }}
        onClick={e => { e.stopPropagation(); if (activeUserId) toggleAttendance(movie.id) }}
        title={going ? "I'm going (tap to remove)" : "I'm going"}
      >
        <IconAttend size={14} />
        {going ? "Going ✓" : "Going?"}
      </button>
    )
  }

  function AttendeeAvatars({ movie }: { movie: Movie }) {
    const attendees = movie.attendees ?? []
    if (!attendees.length) return null
    return (
      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
        {attendees.map(uid => {
          const u = users.find(u => u.id === uid)
          return u ? (
            <div key={uid} title={u.name} className="avatar" style={{ background: u.color, width: 18, height: 18, fontSize: 9 }}>
              {u.name.charAt(0).toUpperCase()}
            </div>
          ) : null
        })}
      </div>
    )
  }

  if (ratingMovie) {
    return <RateMovieSheet movie={ratingMovie} onClose={() => setRatingMovie(null)} />
  }

  return (
    <div className="app-content">
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">CineScores</div>
            {activeUser && (
              <div className="page-subtitle">Hey, {activeUser.name}!</div>
            )}
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card__value">{totalMovies}</div>
            <div className="stat-card__label">Movies</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{watchedCount}</div>
            <div className="stat-card__label">Watched</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{totalRatings}</div>
            <div className="stat-card__label">Ratings</div>
          </div>
        </div>

        {/* Rate These — past date + attended, not yet rated */}
        {rateThese.length > 0 && (
          <div className="section">
            <div className="section-title" style={{ color: 'var(--color-accent)' }}>Rate These</div>
            {rateThese.map(m => (
              <div key={m.id} className="movie-card" onClick={() => setSelected(m)}>
                <MoviePoster posterUrl={m.posterUrl} title={m.title} />
                <div className="movie-info">
                  <div className="movie-title">{m.title}</div>
                  <div className="movie-meta">{[m.year, m.genre].filter(Boolean).join(' · ')}</div>
                  {m.scheduledDate && (
                    <div className="movie-scheduled" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <IconCalendar size={11} />{formatDate(m.scheduledDate)}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn--primary btn--sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); setRatingMovie(m) }}
                >
                  <IconStar size={13} filled /> Rate
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Coming Up — future scheduled */}
        {comingUp.length > 0 && (
          <div className="section">
            <div className="section-title">Coming Up</div>
            {comingUp.map(m => (
              <div key={m.id} className="movie-card" onClick={() => setSelected(m)}>
                <MoviePoster posterUrl={m.posterUrl} title={m.title} />
                <div className="movie-info">
                  <div className="movie-title">{m.title}</div>
                  <div className="movie-meta">{[m.year, m.genre].filter(Boolean).join(' · ')}</div>
                  <div className="movie-scheduled" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconCalendar size={11} />{formatDate(m.scheduledDate!)}
                  </div>
                  <AttendeeAvatars movie={m} />
                </div>
                <AttendButton movie={m} />
              </div>
            ))}
          </div>
        )}

        {/* Proposed — no date yet */}
        {proposed.length > 0 && (
          <div className="section">
            <div className="section-title">Proposed</div>
            {proposed.map(m => (
              <div key={m.id} className="movie-card" onClick={() => setSelected(m)}>
                <MoviePoster posterUrl={m.posterUrl} title={m.title} />
                <div className="movie-info">
                  <div className="movie-title">{m.title}</div>
                  <div className="movie-meta">{[m.year, m.genre].filter(Boolean).join(' · ')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                    <span style={{ flexShrink: 0, color: 'var(--color-text-muted)', lineHeight: 0 }}><IconCalendar size={11} /></span>
                    <input
                      type="date"
                      style={{ fontSize: 12, padding: '2px 6px', maxWidth: 150, height: 28 }}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        if (e.target.value) updateMovie(m.id, { scheduledDate: e.target.value })
                      }}
                      title="Set a watch date"
                    />
                  </div>
                  <AttendeeAvatars movie={m} />
                </div>
                <AttendButton movie={m} />
              </div>
            ))}
          </div>
        )}

        {movies.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon"><IconFilm size={44} /></div>
            <div className="empty-state__text">No movies yet.<br />Head to Movies to add your first one!</div>
          </div>
        )}

        {movies.length > 0 && rateThese.length === 0 && comingUp.length === 0 && proposed.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon"><IconFilm size={44} /></div>
            <div className="empty-state__text">All caught up! Head to Movies to see watched films.</div>
          </div>
        )}
      </div>

      {selected && <MovieDetailSheet movie={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
