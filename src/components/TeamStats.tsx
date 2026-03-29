import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export function TeamStats() {
  const { movies, ratings } = useStore()
  const navigate = useNavigate()

  const totalMovies = movies.length
  const watchedCount = movies.filter(m => m.watched).length
  const ratingsCount = ratings.length

  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-card__value">{totalMovies}</div>
        <div className="stat-card__label">Movies</div>
      </div>
      <button className="stat-card stat-card--btn" onClick={() => navigate('/upcoming?tab=watched')}>
        <div className="stat-card__value">{watchedCount}</div>
        <div className="stat-card__label">Watched</div>
      </button>
      <button className="stat-card stat-card--btn" onClick={() => navigate('/ratings')}>
        <div className="stat-card__value">{ratingsCount}</div>
        <div className="stat-card__label">Ratings</div>
      </button>
    </div>
  )
}
