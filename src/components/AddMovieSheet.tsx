import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { IconBack } from './Icons'
import { sanitizeText } from '../utils/sanitizeText'

interface Props {
  onClose: () => void
}

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation', 'Documentary', 'Other']

const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Action', 35: 'Comedy', 18: 'Drama', 27: 'Horror',
  878: 'Sci-Fi', 53: 'Thriller', 10749: 'Romance', 16: 'Animation', 99: 'Documentary',
}

interface TmdbResult {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  overview: string
  genre_ids: number[]
}

type Status = 'upcoming' | 'watched' | 'unplanned' | 'unreleased'

const TODAY = new Date().toISOString().split('T')[0]
const CURRENT_YEAR = new Date().getFullYear().toString()

const STATUS_LABELS: Record<Status, string> = {
  watched: 'Already Watched',
  upcoming: 'Plan to Watch',
  unplanned: 'Want to Watch',
  unreleased: 'Not Released Yet',
}

const SUBMIT_LABELS: Record<Status, string> = {
  watched: 'Add Watched',
  upcoming: 'Add Movie',
  unplanned: 'Add to Backlog',
  unreleased: 'Add Unreleased',
}

export function AddMovieSheet({ onClose }: Props) {
  const { addMovie, addRating, activeUserId, tmdbApiKey } = useStore()

  const [status, setStatus] = useState<Status>('upcoming')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(CURRENT_YEAR)
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [watchDate, setWatchDate] = useState(TODAY)
  const [releaseDate, setReleaseDate] = useState('')
  const [tmdbId, setTmdbId] = useState<number | null>(null)

  // Rating fields — only used when status === 'watched'
  const [score, setScore] = useState(7)
  const [hovered, setHovered] = useState<number | null>(null)
  const [review, setReview] = useState('')
  const [includeRating, setIncludeRating] = useState(false)

  const [suggestions, setSuggestions] = useState<TmdbResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!tmdbApiKey || title.length < 2) {
      setSuggestions([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&page=1`
        )
        const data = await res.json()
        setSuggestions((data.results ?? []).slice(0, 6))
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [title, tmdbApiKey])

  function selectSuggestion(result: TmdbResult) {
    setTitle(sanitizeText(result.title))
    setYear(result.release_date ? result.release_date.slice(0, 4) : CURRENT_YEAR)
    setPosterUrl(result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : '')
    setDescription(sanitizeText(result.overview ?? ''))
    setGenre(TMDB_GENRE_MAP[result.genre_ids[0]] ?? '')
    setTmdbId(result.id)
    if (result.release_date) setReleaseDate(result.release_date)
    setSuggestions([])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const isWatched = status === 'watched'
    const newId = addMovie({
      title: title.trim(),
      year: year ? parseInt(year) : null,
      genre,
      description,
      posterUrl,
      releaseDate: status === 'unreleased' ? (releaseDate || null) : null,
      scheduledDate: status === 'unplanned' || status === 'unreleased' ? null : (watchDate || null),
      addedBy: activeUserId ?? '',
      tmdbId,
      watched: isWatched,
      watchedAt: isWatched ? (watchDate || TODAY) : null,
    })

    if (isWatched && includeRating && activeUserId) {
      addRating({ movieId: newId, userId: activeUserId, score, review })
    }

    onClose()
  }

  const displayScore = hovered ?? score
  const scoreColor =
    displayScore >= 8 ? 'var(--color-success)' :
    displayScore >= 5 ? 'var(--color-accent)' :
    'var(--color-danger)'

  const statuses: Status[] = ['watched', 'upcoming', 'unplanned', 'unreleased']

  return (
    <div className="page-view">

      <div className="page-nav">
        <button className="page-nav__back" onClick={onClose}>
          <IconBack size={20} /> Back
        </button>
        <div className="page-nav__title">Add Movie</div>
      </div>

      <div className="sheet-body">
          {/* Status toggle */}
          <div className="seg-control" style={{ gridTemplateColumns: `repeat(${statuses.length}, 1fr)` }}>
            {statuses.map(s => (
              <button
                key={s}
                type="button"
                className={`seg-control__btn${status === s ? ' active' : ''}`}
                onClick={() => setStatus(s)}
                style={{ fontSize: 11 }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <form id="add-movie-form" onSubmit={handleSubmit}>

            {/* Title + TMDB search */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Title *</label>
              <input
                autoFocus
                value={title}
                onChange={e => { setTitle(e.target.value); setTmdbId(null) }}
                placeholder={tmdbApiKey ? 'Search for a movie…' : 'Movie title'}
              />
              {searching && <div className="tmdb-searching">Searching…</div>}
              {suggestions.length > 0 && (
                <div className="tmdb-suggestions">
                  {suggestions.map(s => (
                    <div key={s.id} className="tmdb-suggestion" onMouseDown={() => selectSuggestion(s)}>
                      {s.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                          alt={s.title}
                          className="tmdb-suggestion__poster"
                        />
                      ) : (
                        <div className="tmdb-suggestion__poster tmdb-suggestion__poster--empty">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '55%', height: '55%', opacity: 0.3 }}>
                            <rect x="2" y="2" width="20" height="20" rx="2" />
                            <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                          </svg>
                        </div>
                      )}
                      <div className="tmdb-suggestion__info">
                        <div className="tmdb-suggestion__title">{s.title}</div>
                        {s.release_date && (
                          <div className="tmdb-suggestion__year">{s.release_date.slice(0, 4)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!tmdbApiKey && (
              <div className="tmdb-hint">
                Add a TMDB API key in Settings to enable automatic poster &amp; metadata lookup.
              </div>
            )}

            {/* Poster preview */}
            {posterUrl && (
              <div className="poster-preview">
                <img src={posterUrl} alt="Poster preview" className="poster-preview__img" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>{title}</div>
                  {year && <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{year}</div>}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    style={{ marginTop: 'var(--space-sm)', color: 'var(--color-danger)' }}
                    onClick={() => setPosterUrl('')}
                  >
                    Remove poster
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                min="1900"
                max="2099"
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

            {!posterUrl && (
              <div className="form-group">
                <label>Poster URL</label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={e => setPosterUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            )}

            {/* Release date — only for unreleased */}
            {status === 'unreleased' && (
              <div className="form-group">
                <label>Release Date</label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={e => setReleaseDate(e.target.value)}
                  style={{ maxWidth: 180 }}
                />
              </div>
            )}

            {/* Scheduled date — only for upcoming (plan to watch) */}
            {status === 'upcoming' && (
              <div className="form-group">
                <label>Scheduled Date</label>
                <input
                  type="date"
                  value={watchDate}
                  onChange={e => setWatchDate(e.target.value)}
                  style={{ maxWidth: 180 }}
                />
              </div>
            )}

            {/* Watch date — only for watched */}
            {status === 'watched' && (
              <div className="form-group">
                <label>Watch Date</label>
                <input
                  type="date"
                  value={watchDate}
                  onChange={e => setWatchDate(e.target.value)}
                  style={{ maxWidth: 180 }}
                />
              </div>
            )}

            {/* Inline rating — only for watched */}
            {status === 'watched' && (
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                  <label style={{ marginBottom: 0 }}>Add Your Rating</label>
                  <button
                    type="button"
                    className={`btn btn--sm${includeRating ? ' btn--secondary' : ' btn--ghost'}`}
                    style={{ fontSize: 12 }}
                    onClick={() => setIncludeRating(r => !r)}
                  >
                    {includeRating ? 'On ✓' : 'Off'}
                  </button>
                </div>
                {includeRating && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                      <div className="star-row">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                          <span
                            key={n}
                            className={`star${n <= displayScore ? ' filled' : ''}`}
                            onMouseEnter={() => setHovered(n)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => setScore(n)}
                          >★</span>
                        ))}
                      </div>
                      <div className="score-display" style={{ color: scoreColor, minWidth: 36 }}>
                        {displayScore}
                      </div>
                    </div>
                    <textarea
                      value={review}
                      onChange={e => setReview(e.target.value)}
                      placeholder="Review (optional)"
                      rows={2}
                    />
                  </>
                )}
              </div>
            )}

          </form>
        </div>

        <div className="sheet-footer">
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button type="button" className="btn btn--secondary btn--full" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form="add-movie-form" className="btn btn--primary btn--full" disabled={!title.trim()}>
              {SUBMIT_LABELS[status]}
            </button>
          </div>
      </div>

    </div>
  )
}
