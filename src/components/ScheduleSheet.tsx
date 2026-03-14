import { useState } from 'react'
import { useStore } from '../store'
import type { Movie } from '../types'
import { IconBack, IconCalendar } from './Icons'

interface Props {
  movie: Movie
  onClose: () => void
  mode?: 'schedule' | 'release'
}

const TODAY = new Date().toISOString().split('T')[0]

export function ScheduleSheet({ movie, onClose, mode = 'schedule' }: Props) {
  const { updateMovie, users } = useStore()

  const isRelease = mode === 'release'
  const currentDate = isRelease ? movie.releaseDate : movie.scheduledDate
  const [date, setDate] = useState(currentDate ?? TODAY)

  const interestedUsers = (movie.interestedUsers ?? []).map(id => users.find(u => u.id === id)).filter(Boolean)

  const title = isRelease
    ? 'Edit Release Date'
    : currentDate ? 'Reschedule' : 'Schedule Movie'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return
    updateMovie(movie.id, isRelease ? { releaseDate: date } : { scheduledDate: date })
    onClose()
  }

  function handleUnknown() {
    updateMovie(movie.id, isRelease ? { releaseDate: null } : { scheduledDate: null })
    onClose()
  }

  return (
    <div className="page-view">

      <div className="page-nav">
        <button className="page-nav__back" onClick={onClose}>
          <IconBack size={20} /> Back
        </button>
        <div className="page-nav__title">{title}</div>
      </div>

      <div className="sheet-body">
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{movie.title}</div>
          {movie.year && <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{movie.year}</div>}
        </div>

        {!isRelease && interestedUsers.length > 0 && (
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="section-title" style={{ marginBottom: 'var(--space-sm)' }}>Interested</div>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', alignItems: 'center' }}>
              {interestedUsers.map(u => u && (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    className="avatar"
                    style={{ background: u.color, width: 28, height: 28, fontSize: 12 }}
                    title={u.name}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form id="schedule-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCalendar size={14} /> {isRelease ? 'Release Date' : 'Watch Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ maxWidth: 200 }}
              autoFocus
            />
          </div>
        </form>

        <div style={{ marginTop: 'var(--space-md)' }}>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ color: 'var(--color-text-muted)', fontSize: 13 }}
            onClick={handleUnknown}
          >
            Date Unknown — clear it
          </button>
        </div>
      </div>

      <div className="sheet-footer">
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button type="button" className="btn btn--secondary btn--full" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="schedule-form" className="btn btn--primary btn--full" disabled={!date}>
            {isRelease ? 'Save Date' : currentDate ? 'Reschedule' : 'Schedule'}
          </button>
        </div>
      </div>

    </div>
  )
}
