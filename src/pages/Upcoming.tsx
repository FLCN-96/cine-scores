import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { MoviePoster } from '../components/MoviePoster'
import { MovieDetailSheet } from '../components/MovieDetailSheet'
import { AddMovieSheet } from '../components/AddMovieSheet'
import { RateMovieSheet } from '../components/RateMovieSheet'
import { ScheduleSheet } from '../components/ScheduleSheet'
import { useAllMovieStats } from '../hooks/useMovieStats'
import { IconCalendar, IconClipboard, IconEye, IconCheck, IconStar } from '../components/Icons'
import type { Movie } from '../types'

type Filter = 'unreleased' | 'unscheduled' | 'upcoming' | 'watched'

const TODAY = new Date().toISOString().split('T')[0]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Clock icon for "not released" tab
function IconClock({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function Upcoming() {
  const { movies, ratings, users, activeUserId, toggleInterest } = useStore()
  const [selected, setSelected] = useState<Movie | null>(null)
  const [ratingMovie, setRatingMovie] = useState<Movie | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [schedulingMovie, setSchedulingMovie] = useState<Movie | null>(null)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const statsMap = useAllMovieStats(movies, ratings)

  const filtered = useMemo(() => {
    if (filter === 'unreleased') {
      return movies
        .filter(m => !m.watched && !m.scheduledDate && m.releaseDate !== null)
        .sort((a, b) => {
          const aAvail = a.releaseDate && a.releaseDate <= TODAY
          const bAvail = b.releaseDate && b.releaseDate <= TODAY
          if (aAvail && !bAvail) return -1
          if (!aAvail && bAvail) return 1
          return new Date(a.releaseDate!).getTime() - new Date(b.releaseDate!).getTime()
        })
    }
    if (filter === 'unscheduled') {
      return movies
        .filter(m => !m.watched && !m.scheduledDate && !m.releaseDate)
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    }
    if (filter === 'upcoming') {
      return movies
        .filter(m => !m.watched && m.scheduledDate)
        .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
    }
    return movies
      .filter(m => m.watched)
      .sort((a, b) => new Date(b.watchedAt!).getTime() - new Date(a.watchedAt!).getTime())
  }, [movies, filter])

  const counts = useMemo(() => ({
    unreleased: movies.filter(m => !m.watched && !m.scheduledDate && m.releaseDate !== null).length,
    unscheduled: movies.filter(m => !m.watched && !m.scheduledDate && !m.releaseDate).length,
    upcoming: movies.filter(m => !m.watched && m.scheduledDate).length,
    watched: movies.filter(m => m.watched).length,
  }), [movies])

  const ratedByMe = useMemo(() =>
    new Set(ratings.filter(r => r.userId === activeUserId).map(r => r.movieId)),
    [ratings, activeUserId]
  )

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

  const tabs: { key: Filter; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'unreleased', label: 'Not Released', icon: <IconClock size={12} />, count: counts.unreleased },
    { key: 'unscheduled', label: 'Backlog', icon: <IconClipboard size={12} />, count: counts.unscheduled },
    { key: 'upcoming', label: 'Scheduled', icon: <IconCalendar size={12} />, count: counts.upcoming },
    { key: 'watched', label: 'Watched', icon: <IconEye size={12} />, count: counts.watched },
  ]

  return (
    <div className="app-content">
      <div className="page">
        <div className="page-header">
          <div className="page-title">Movies</div>
          <button className="btn btn--primary btn--sm" onClick={() => setShowAdd(true)}>
            + Add
          </button>
        </div>

        <div className="chip-row">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`chip${filter === tab.key ? ' active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {tab.icon}{tab.label} ({tab.count})
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              {filter === 'unreleased' ? <IconClock size={44} /> :
               filter === 'upcoming' ? <IconCalendar size={44} /> :
               filter === 'unscheduled' ? <IconClipboard size={44} /> :
               <IconEye size={44} />}
            </div>
            <div className="empty-state__text">
              {filter === 'unreleased' ? 'No unreleased movies tracked.' :
               filter === 'upcoming' ? 'No scheduled movies yet.' :
               filter === 'unscheduled' ? 'Backlog is empty.' :
               'Nothing watched yet.'}
            </div>
          </div>
        ) : (
          <div className="section">
            {filtered.map(m => {
              const stats = statsMap[m.id]
              const notRatedByMe = activeUserId && !ratedByMe.has(m.id) && m.watched
              const isAvailableNow = !m.watched && !m.scheduledDate && m.releaseDate && m.releaseDate <= TODAY
              const showInterest = filter === 'unreleased' || filter === 'unscheduled'
              const showScheduleBtn = filter === 'unreleased' || filter === 'unscheduled'

              return (
                <div key={m.id} className="movie-card" onClick={() => setSelected(m)}>
                  <MoviePoster posterUrl={m.posterUrl} title={m.title} />
                  <div className="movie-info">
                    <div className="movie-title">{m.title}</div>
                    <div className="movie-meta">{[m.year, m.genre].filter(Boolean).join(' · ')}</div>
                    {filter === 'unreleased' && m.releaseDate && (
                      isAvailableNow ? (
                        <span className="badge badge--available" style={{ marginTop: 4 }}>Now Available</span>
                      ) : (
                        <div className="movie-scheduled" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <IconCalendar size={12} />Out {formatDate(m.releaseDate)}
                        </div>
                      )
                    )}
                    {filter === 'upcoming' && m.scheduledDate && !m.watched && (
                      <div className="movie-scheduled" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconCalendar size={12} />{formatDate(m.scheduledDate)}
                      </div>
                    )}
                    {m.watched && (
                      <span className="movie-watched-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconCheck size={11} />Watched
                      </span>
                    )}
                    {showInterest && (m.interestedUsers ?? []).length > 0 && (
                      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                        {(m.interestedUsers ?? []).map(uid => {
                          const u = users.find(u => u.id === uid)
                          return u ? (
                            <div key={uid} title={u.name} className="avatar" style={{ background: u.color, width: 18, height: 18, fontSize: 9 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          ) : null
                        })}
                      </div>
                    )}
                    {filter === 'upcoming' && !m.watched && (m.attendees ?? []).length > 0 && (
                      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                        {(m.attendees ?? []).map(uid => {
                          const u = users.find(u => u.id === uid)
                          return u ? (
                            <div key={uid} title={u.name} className="avatar" style={{ background: u.color, width: 18, height: 18, fontSize: 9 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {stats.avg !== null && (
                      <div style={{
                        fontWeight: 800, fontSize: 20,
                        color: stats.avg >= 8 ? 'var(--color-success)' : stats.avg >= 5 ? 'var(--color-accent)' : 'var(--color-danger)'
                      }}>
                        {stats.avg}
                      </div>
                    )}
                    {notRatedByMe && (
                      <button
                        className="btn btn--sm btn--ghost"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)' }}
                        onClick={e => { e.stopPropagation(); setRatingMovie(m) }}
                      >
                        <IconStar size={13} filled /> Rate
                      </button>
                    )}
                    {showInterest && (
                      <InterestButton movie={m} />
                    )}
                    {showScheduleBtn && (
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
      </div>

      {selected && <MovieDetailSheet movie={selected} onClose={() => setSelected(null)} />}
      {ratingMovie && <RateMovieSheet movie={ratingMovie} onClose={() => setRatingMovie(null)} />}
      {showAdd && <AddMovieSheet onClose={() => setShowAdd(false)} />}
      {schedulingMovie && <ScheduleSheet movie={schedulingMovie} onClose={() => setSchedulingMovie(null)} />}
    </div>
  )
}
