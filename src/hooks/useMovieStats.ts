import { useMemo } from 'react'
import { useStore } from '../store'
import type { Movie, Rating } from '../types'

export function useMovieStats(movieId: string) {
  const ratings = useStore(s => s.ratings)
  return useMemo(() => {
    const movieRatings = ratings.filter(r => r.movieId === movieId)
    if (!movieRatings.length) return { avg: null, count: 0 }
    const avg = movieRatings.reduce((sum, r) => sum + r.score, 0) / movieRatings.length
    return { avg: Math.round(avg * 10) / 10, count: movieRatings.length }
  }, [ratings, movieId])
}

export function useAllMovieStats(movies: Movie[], ratings: Rating[]) {
  return useMemo(() => {
    const map: Record<string, { avg: number | null; count: number }> = {}
    for (const m of movies) {
      const mrs = ratings.filter(r => r.movieId === m.id)
      if (!mrs.length) {
        map[m.id] = { avg: null, count: 0 }
      } else {
        const avg = mrs.reduce((sum, r) => sum + r.score, 0) / mrs.length
        map[m.id] = { avg: Math.round(avg * 10) / 10, count: mrs.length }
      }
    }
    return map
  }, [movies, ratings])
}

export function useHomeStats() {
  const movies = useStore(s => s.movies)
  const ratings = useStore(s => s.ratings)
  const users = useStore(s => s.users)

  return useMemo(() => {
    const watched = movies.filter(m => m.watched)
    const upcoming = movies.filter(m => !m.watched && m.scheduledDate)
    const topRated = [...watched]
      .map(m => {
        const mrs = ratings.filter(r => r.movieId === m.id)
        const avg = mrs.length ? mrs.reduce((s, r) => s + r.score, 0) / mrs.length : 0
        return { movie: m, avg }
      })
      .filter(x => x.avg > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)

    const nextUp = [...upcoming]
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
      .slice(0, 3)

    const recentlyRated = [...ratings]
      .sort((a, b) => new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime())
      .slice(0, 5)

    return { watched, upcoming, topRated, nextUp, recentlyRated, totalUsers: users.length, totalMovies: movies.length, totalRatings: ratings.length }
  }, [movies, ratings, users])
}
