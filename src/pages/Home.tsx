import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { MoviePoster } from '../components/MoviePoster'
import { MovieDetailSheet } from '../components/MovieDetailSheet'
import { RateMovieSheet } from '../components/RateMovieSheet'
import { ScheduleSheet } from '../components/ScheduleSheet'
import { IconFilm, IconCalendar, IconStar, IconAttend } from '../components/Icons'
import type { Movie } from '../types'

const TODAY = new Date().toISOString().split('T')[0]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function Home() {
  const { movies, users, ratings, activeUserId, toggleAttendance, toggleInterest } = useStore()
  const [selected, setSelected] = useState<Movie | null>(null)
  const [ratingMovie, setRatingMovie] = useState<Movie | null>(null)
  const [schedulingMovie, setSchedulingMovie] = useState<Movie | null>(null)

  const activeUser = users.find(u => u.id === activeUserId)

  const { rateThese, comingUp, notReleased, wantToWatch } = useMemo(() => {
    const ratedMovieIds = new Set(
      ratings.filter(r => r.userId === activeUserId).map(r => r.movieId)
    )

    // Rate these: watched movies OR past-date events, not yet rated by active user
    const rateThese = movies.filter(m => {
      if (!activeUserId || ratedMovieIds.has(m.id)) return false
      return m.watched || (m.scheduledDate !== null && m.scheduledDate < TODAY)
    }).sort((a, b) => {
      const aDate = a.watchedAt ?? a.scheduledDate ?? a.addedAt
      const bDate = b.watchedAt ?? b.scheduledDate ?? b.addedAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })

    // Coming up: future-scheduled, not watched
    const comingUp = movies.filter(m =>
      !m.watched && m.scheduledDate !== null && m.scheduledDate >= TODAY
    ).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())

    // Not released yet: has releaseDate, no scheduledDate, not watched
    const notReleased = movies.filter(m =>
      !m.watched && !m.scheduledDate && m.releaseDate !== null
    ).sort((a, b) => {
      // Available now first, then by release date
      const aAvail = a.releaseDate && a.releaseDate <= TODAY
      const bAvail = b.releaseDate && b.releaseDate <= TODAY
      if (aAvail && !bAvail) return -1
      if (!aAvail && bAvail) return 1
      return new Date(a.releaseDate!).getTime() - new Date(b.releaseDate!).getTime()
    })

    // Want to watch: no releaseDate, no scheduledDate, not watched
    const wantToWatch = movies.filter(m =>
      !m.watched && !m.scheduledDate && !m.releaseDate
    ).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

    return { rateThese, comingUp, notReleased, wantToWatch }
  }, [movies, ratings, activeUserId])

  const watchedCount = movies.filter(m => m.watched).length
  const totalMovies = movies.length
  const totalRatings = ratings.filter(r => r.userId === activeUserId).length

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
        title={going ? "Remove attendance" : "Mark as attending"}
      >
        <IconAttend size={14} />
        {going ? 'Going ✓' : 'Going?'}
      </button>
    )
  }

  function InterestButton({ movie }: { movie: Movie }) {
    const interested = activeUserId ? (movie.interestedUsers ?? []).includes(activeUserId) : false
    const count = (movie.interestedUsers ?? []).length
    return (
      <button
        className={`btn btn--sm interest-btn${interested ? ' interest-btn--active' : ''}`}
        onClick={e => { e.stopPropagation(); if (activeUserId) toggleInterest(movie.id) }}
        title={interested ? 'Remove interest' : 'Mark as interested'}
      >
        {interested ? '♥' : '♡'}{count > 0 ? ` ${count}` : ''}
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

  function InterestedAvatars({ movie }: { movie: Movie }) {
    const interested = movie.interestedUsers ?? []
    if (!interested.length) return null
    return (
      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
        {interested.map(uid => {
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

        {/* Rate These — watched or past events not yet rated by active user */}
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

        {/* Not Released Yet — has releaseDate, no scheduledDate */}
        {notReleased.length > 0 && (
          <div className="section">
            <div className="section-title">Not Released Yet</div>
            {notReleased.map(m => {
              const isAvailableNow = m.releaseDate && m.releaseDate <= TODAY
              return (
                <div key={m.id} className="movie-card" onClick={() => setSelected(m)}>
                  <MoviePoster posterUrl={m.posterUrl} title={m.title} />
                  <div className="movie-info">
                    <div className="movie-title">{m.title}</div>
                    <div className="movie-meta">{[m.year, m.genre].filter(Boolean).join(' · ')}</div>
                    {isAvailableNow ? (
                      <span className="badge badge--available" style={{ marginTop: 4 }}>Now Available</span>
                    ) : m.releaseDate ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4, color: 'var(--color-text-secondary)' }}>
                        <IconCalendar size={11} />Out {formatDate(m.releaseDate)}
                      </div>
                    ) : null}
                    <InterestedAvatars movie={m} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
                    <InterestButton movie={m} />
                    {isAvailableNow && (
                      <button
                        className="btn btn--sm btn--ghost"
                        style={{ fontSize: 12 }}
                        onClick={e => { e.stopPropagation(); setSchedulingMovie(m) }}
                      >
                        Schedule
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Want to Watch — backlog (no releaseDate, no scheduledDate) */}
        {wantToWatch.length > 0 && (
          <div className="section">
            <div className="section-title">Want to Watch</div>
            {wantToWatch.map(m => (
              <div key={m.id} className="movie-card" onClick={() => setSelected(m)}>
                <MoviePoster posterUrl={m.posterUrl} title={m.title} />
                <div className="movie-info">
                  <div className="movie-title">{m.title}</div>
                  <div className="movie-meta">{[m.year, m.genre].filter(Boolean).join(' · ')}</div>
                  <InterestedAvatars movie={m} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
                  <InterestButton movie={m} />
                  <button
                    className="btn btn--sm btn--ghost"
                    style={{ fontSize: 12 }}
                    onClick={e => { e.stopPropagation(); setSchedulingMovie(m) }}
                  >
                    Schedule
                  </button>
                </div>
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

        {movies.length > 0 && rateThese.length === 0 && comingUp.length === 0 && notReleased.length === 0 && wantToWatch.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon"><IconFilm size={44} /></div>
            <div className="empty-state__text">All caught up!</div>
          </div>
        )}
      </div>

      {selected && <MovieDetailSheet movie={selected} onClose={() => setSelected(null)} />}
      {ratingMovie && <RateMovieSheet movie={ratingMovie} onClose={() => setRatingMovie(null)} />}
      {schedulingMovie && <ScheduleSheet movie={schedulingMovie} onClose={() => setSchedulingMovie(null)} />}
    </div>
  )
}
