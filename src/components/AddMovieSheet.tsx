import { useState } from 'react'
import { useStore } from '../store'

interface Props {
  onClose: () => void
}

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation', 'Documentary', 'Other']

export function AddMovieSheet({ onClose }: Props) {
  const { addMovie, activeUserId } = useStore()
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addMovie({
      title: title.trim(),
      year: year ? parseInt(year) : null,
      genre,
      description,
      posterUrl,
      scheduledDate: scheduledDate || null,
      addedBy: activeUserId ?? '',
      tmdbId: null,
    })
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Add Movie</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Movie title"
            />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="e.g. 2024"
              min="1900"
              max="2030"
            />
          </div>
          <div className="form-group">
            <label>Genre</label>
            <select value={genre} onChange={e => setGenre(e.target.value)}>
              <option value="">Select genre…</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
            />
          </div>
          <div className="form-group">
            <label>Poster URL</label>
            <input
              type="url"
              value={posterUrl}
              onChange={e => setPosterUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>Watch Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button type="button" className="btn btn--secondary btn--full" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary btn--full" disabled={!title.trim()}>
              Add Movie
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
