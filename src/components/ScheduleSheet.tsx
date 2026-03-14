import { useState } from 'react'
import { useStore } from '../store'
import type { Movie } from '../types'
import { IconBack, IconCalendar } from './Icons'

interface Props {
  movie: Movie
  onClose: () => void
}

const TODAY = new Date().toISOString().split('T')[0]

export function ScheduleSheet({ movie, onClose }: Props) {
  const { updateMovie, users } = useStore()
  const [date, setDate] = useState(movie.scheduledDate ?? TODAY)

  const interestedUsers = (movie.interestedUsers ?? []).map(id => users.find(u => u.id === id)).filter(Boolean)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return
    updateMovie(movie.id, { scheduledDate: date })
    onClose()
  }

  return (
    <div className="page-view">

      <div className="page-nav">
        <button className="page-nav__back" onClick={onClose}>
          <IconBack size={20} /> Back
        </button>
        <div className="page-nav__title">Schedule Movie</div>
      </div>

      <div className="sheet-body">
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{movie.title}</div>
          {movie.year && <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{movie.year}</div>}
        </div>

        {interestedUsers.length > 0 && (
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
              <IconCalendar size={14} /> Watch Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={TODAY}
              style={{ maxWidth: 200 }}
              autoFocus
            />
          </div>
        </form>
      </div>

      <div className="sheet-footer">
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button type="button" className="btn btn--secondary btn--full" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="schedule-form" className="btn btn--primary btn--full" disabled={!date}>
            Schedule
          </button>
        </div>
      </div>

    </div>
  )
}
