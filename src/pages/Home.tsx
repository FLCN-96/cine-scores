import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { MovieDetailSheet } from '../components/MovieDetailSheet'
import { MarqueeRow } from '../components/MarqueeRow'
import { DiscoveryPreviewSheet } from '../components/DiscoveryPreviewSheet'
import { useTmdbDiscovery, type TmdbDiscoveryMovie } from '../hooks/useTmdbDiscovery'
import { IconFilm } from '../components/Icons'
import type { Movie, User } from '../types'

const TODAY = new Date().toISOString().split('T')[0]

type MovieCategory = 'scheduled' | 'available' | 'upcoming' | 'backlog'

function categorize(m: Movie, today: string): MovieCategory {
  if (!m.watched && m.scheduledDate && m.scheduledDate >= today) return 'scheduled'
  if (!m.watched && !m.scheduledDate && m.releaseDate && m.releaseDate <= today) return 'available'
  if (!m.watched && !m.scheduledDate && m.releaseDate && m.releaseDate > today) return 'upcoming'
  return 'backlog'
}

function formatShortDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function badgeLabel(m: Movie, cat: MovieCategory): string {
  if (cat === 'scheduled') return formatShortDate(m.scheduledDate!)
  if (cat === 'upcoming') return formatShortDate(m.releaseDate!)
  if (cat === 'available') return 'Available'
  return 'Backlog'
}

function PosterCell({ movie, category, users, activeUserId, onTap, onToggleInterest }: {
  movie: Movie
  category: MovieCategory
  users: User[]
  activeUserId: string | null
  onTap: () => void
  onToggleInterest: () => void
}) {
  const interested = activeUserId ? (movie.interestedUsers ?? []).includes(activeUserId) : false
  const avatarIds = category === 'scheduled' ? (movie.attendees ?? []) : (movie.interestedUsers ?? [])
  const avatarUsers = avatarIds
    .map(uid => users.find(u => u.id === uid))
    .filter((u): u is User => u !== undefined)

  return (
    <div className="poster-cell" onClick={onTap}>
      {/* Poster image or placeholder */}
      <div className="poster-cell__img">
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} />
        ) : (
          <div className="poster-cell__placeholder">
            <IconFilm size={24} />
            <div className="poster-cell__placeholder-title">{movie.title}</div>
          </div>
        )}
      </div>

      {/* Date badge — top left */}
      <div className={`poster-badge poster-badge--${category}`}>
        {badgeLabel(movie, category)}
      </div>

      {/* Heart button — top right */}
      <button
        className={`poster-heart${interested ? ' poster-heart--active' : ''}`}
        onClick={e => { e.stopPropagation(); onToggleInterest() }}
        aria-label={`Toggle interest for ${movie.title}`}
      >
        {interested ? '♥' : '♡'}
      </button>

      {/* Avatars — bottom left (attendees for scheduled, interested for others) */}
      {avatarUsers.length > 0 && (
        <div className="poster-avatars">
          {avatarUsers.slice(0, 4).map(u => (
            <div key={u.id} className="poster-avatar" style={{ background: u.color }}>
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Home() {
  const { movies, users, activeUserId, toggleInterest } = useStore()
  const [selected, setSelected] = useState<Movie | null>(null)
  const [discoveryMovie, setDiscoveryMovie] = useState<TmdbDiscoveryMovie | null>(null)
  const { nowPlaying, upcoming: comingSoon } = useTmdbDiscovery()

  const activeUser = users.find(u => u.id === activeUserId)

  const gridMovies = useMemo(() => {
    const PRIORITY: Record<MovieCategory, number> = { scheduled: 0, available: 1, upcoming: 2, backlog: 3 }

    return movies
      .filter(m => !m.watched)
      .map(m => ({ movie: m, category: categorize(m, TODAY) }))
      .sort((a, b) => {
        if (PRIORITY[a.category] !== PRIORITY[b.category])
          return PRIORITY[a.category] - PRIORITY[b.category]
        if (a.category === 'scheduled')
          return new Date(a.movie.scheduledDate!).getTime() - new Date(b.movie.scheduledDate!).getTime()
        if (a.category === 'upcoming')
          return new Date(a.movie.releaseDate!).getTime() - new Date(b.movie.releaseDate!).getTime()
        return new Date(b.movie.addedAt).getTime() - new Date(a.movie.addedAt).getTime()
      })
  }, [movies])

  const hasMarquee = nowPlaying.length > 0 || comingSoon.length > 0

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

        <MarqueeRow title="Now Playing" movies={nowPlaying} onMovieTap={setDiscoveryMovie} />
        <MarqueeRow title="Coming Soon" movies={comingSoon} onMovieTap={setDiscoveryMovie} />

        {gridMovies.length > 0 && (
          <>
            {hasMarquee && <div className="home-section-label">Your Movies</div>}
            <div className="poster-grid">
              {gridMovies.map(({ movie, category }) => (
                <PosterCell
                  key={movie.id}
                  movie={movie}
                  category={category}
                  users={users}
                  activeUserId={activeUserId}
                  onTap={() => setSelected(movie)}
                  onToggleInterest={() => activeUserId && toggleInterest(movie.id)}
                />
              ))}
            </div>
          </>
        )}

        {movies.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon"><IconFilm size={44} /></div>
            <div className="empty-state__text">No movies yet.<br />Head to Movies to add your first one!</div>
          </div>
        )}

        {movies.length > 0 && gridMovies.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon"><IconFilm size={44} /></div>
            <div className="empty-state__text">All caught up!</div>
          </div>
        )}
      </div>

      {selected && <MovieDetailSheet movie={selected} onClose={() => setSelected(null)} />}
      {discoveryMovie && <DiscoveryPreviewSheet movie={discoveryMovie} onClose={() => setDiscoveryMovie(null)} />}
    </div>
  )
}
