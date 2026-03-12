import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { MoviePoster } from '../components/MoviePoster'
import { MovieDetailSheet } from '../components/MovieDetailSheet'
import { AddMovieSheet } from '../components/AddMovieSheet'
import { useAllMovieStats } from '../hooks/useMovieStats'
import { IconCalendar, IconClipboard, IconEye, IconCheck } from '../components/Icons'
import type { Movie } from '../types'

type Filter = 'upcoming' | 'watched' | 'unscheduled'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function Upcoming() {
  const { movies, ratings } = useStore()
  const [selected, setSelected] = useState<Movie | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const statsMap = useAllMovieStats(movies, ratings)

  const filtered = useMemo(() => {
    if (filter === 'upcoming') {
      return movies
        .filter(m => !m.watched && m.scheduledDate)
        .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
    }
    if (filter === 'unscheduled') {
      return movies
        .filter(m => !m.watched && !m.scheduledDate)
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    }
    return movies
      .filter(m => m.watched)
      .sort((a, b) => new Date(b.watchedAt!).getTime() - new Date(a.watchedAt!).getTime())
  }, [movies, filter])

  const counts = useMemo(() => ({
    upcoming: movies.filter(m => !m.watched && m.scheduledDate).length,
    unscheduled: movies.filter(m => !m.watched && !m.scheduledDate).length,
    watched: movies.filter(m => m.watched).length,
  }), [movies])

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
          {(['upcoming', 'unscheduled', 'watched'] as Filter[]).map(f => (
            <button
              key={f}
              className={`chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'upcoming' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconCalendar size={12} />Scheduled ({counts.upcoming})</span>
              ) : f === 'unscheduled' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconClipboard size={12} />Backlog ({counts.unscheduled})</span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconEye size={12} />Watched ({counts.watched})</span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              {filter === 'upcoming' ? <IconCalendar size={44} /> : filter === 'unscheduled' ? <IconClipboard size={44} /> : <IconEye size={44} />}
            </div>
            <div className="empty-state__text">
              {filter === 'upcoming' ? 'No scheduled movies yet.' :
               filter === 'unscheduled' ? 'No backlog movies.' :
               'Nothing watched yet.'}
            </div>
          </div>
        ) : (
          <div className="section">
            {filtered.map(m => {
              const stats = statsMap[m.id]
              return (
                <div key={m.id} className="movie-card" onClick={() => setSelected(m)}>
                  <MoviePoster posterUrl={m.posterUrl} title={m.title} />
                  <div className="movie-info">
                    <div className="movie-title">{m.title}</div>
                    <div className="movie-meta">{[m.year, m.genre].filter(Boolean).join(' · ')}</div>
                    {m.scheduledDate && !m.watched && (
                      <div className="movie-scheduled" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconCalendar size={12} />{formatDate(m.scheduledDate)}
                      </div>
                    )}
                    {m.watched && (
                      <span className="movie-watched-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconCheck size={11} />Watched
                      </span>
                    )}
                  </div>
                  {stats.avg !== null && (
                    <div style={{
                      fontWeight: 800, fontSize: 20,
                      color: stats.avg >= 8 ? 'var(--color-success)' : stats.avg >= 5 ? 'var(--color-accent)' : 'var(--color-danger)'
                    }}>
                      {stats.avg}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && <MovieDetailSheet movie={selected} onClose={() => setSelected(null)} />}
      {showAdd && <AddMovieSheet onClose={() => setShowAdd(false)} />}
    </div>
  )
}
