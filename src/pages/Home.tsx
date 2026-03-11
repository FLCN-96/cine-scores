import { useState } from 'react'
import { useStore } from '../store'
import { useHomeStats } from '../hooks/useMovieStats'
import { MoviePoster } from '../components/MoviePoster'
import { MovieDetailSheet } from '../components/MovieDetailSheet'
import type { Movie } from '../types'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function Home() {
  const { users, activeUserId } = useStore()
  const { watched, topRated, nextUp, recentlyRated, totalMovies, totalRatings } = useHomeStats()
  const allMovies = useStore(s => s.movies)
  const [selected, setSelected] = useState<Movie | null>(null)

  const activeUser = users.find(u => u.id === activeUserId)

  return (
    <div className="app-content">
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">CineScores 🎬</div>
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
            <div className="stat-card__value">{watched.length}</div>
            <div className="stat-card__label">Watched</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{totalRatings}</div>
            <div className="stat-card__label">Ratings</div>
          </div>
        </div>

        {nextUp.length > 0 && (
          <div className="section">
            <div className="section-title">Up Next</div>
            {nextUp.map(m => (
              <div key={m.id} className="movie-card" onClick={() => setSelected(m)}>
                <MoviePoster posterUrl={m.posterUrl} title={m.title} />
                <div className="movie-info">
                  <div className="movie-title">{m.title}</div>
                  <div className="movie-meta">{[m.year, m.genre].filter(Boolean).join(' · ')}</div>
                  {m.scheduledDate && (
                    <div className="movie-scheduled">📅 {formatDate(m.scheduledDate)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {topRated.length > 0 && (
          <div className="section">
            <div className="section-title">Top Rated</div>
            {topRated.map(({ movie, avg }, i) => (
              <div key={movie.id} className="movie-card" onClick={() => setSelected(movie)}>
                <div className={`rank rank--${i + 1}`}>{i + 1}</div>
                <MoviePoster posterUrl={movie.posterUrl} title={movie.title} />
                <div className="movie-info">
                  <div className="movie-title">{movie.title}</div>
                  <div className="movie-meta">{[movie.year, movie.genre].filter(Boolean).join(' · ')}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 22, color: avg >= 8 ? 'var(--color-success)' : avg >= 5 ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                  {avg}
                </div>
              </div>
            ))}
          </div>
        )}

        {recentlyRated.length > 0 && (
          <div className="section">
            <div className="section-title">Recent Activity</div>
            {recentlyRated.map(r => {
              const movie = allMovies.find(m => m.id === r.movieId)
              const user = users.find(u => u.id === r.userId)
              if (!movie) return null
              return (
                <div key={r.id} className="row-item" style={{ cursor: 'pointer' }} onClick={() => setSelected(movie)}>
                  <div className="avatar" style={{ background: user?.color ?? '#555', width: 32, height: 32, fontSize: 12 }}>
                    {user?.name.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="row-item__body">
                    <div className="row-item__title">{user?.name} rated <strong>{movie.title}</strong></div>
                    {r.review && <div className="row-item__subtitle">"{r.review}"</div>}
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: 20,
                    color: r.score >= 8 ? 'var(--color-success)' : r.score >= 5 ? 'var(--color-accent)' : 'var(--color-danger)'
                  }}>
                    {r.score}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {allMovies.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">🎬</div>
            <div className="empty-state__text">No movies yet.<br />Head to Upcoming to add your first one!</div>
          </div>
        )}
      </div>

      {selected && <MovieDetailSheet movie={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
