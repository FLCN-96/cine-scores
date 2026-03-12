import { create } from 'zustand'
import type { AppState, User, Movie, Rating, SyncConfig } from '../types'

const LS = {
  users: 'cine-scores:users',
  movies: 'cine-scores:movies',
  ratings: 'cine-scores:ratings',
  activeUserId: 'cine-scores:activeUserId',
  syncConfig: 'cine-scores:syncConfig',
  tmdbApiKey: 'cine-scores:tmdbApiKey',
  deletedUserIds: 'cine-scores:deletedUserIds',
  deletedMovieIds: 'cine-scores:deletedMovieIds',
  deletedRatingIds: 'cine-scores:deletedRatingIds',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useStore = create<AppState>((set, get) => ({
  users: [],
  movies: [],
  ratings: [],
  activeUserId: null,
  syncConfig: null,
  tmdbApiKey: null,
  deletedUserIds: [],
  deletedMovieIds: [],
  deletedRatingIds: [],
  hydrated: false,

  hydrate() {
    const users = load<User[]>(LS.users, [])
    const movies = load<Movie[]>(LS.movies, [])
    const ratings = load<Rating[]>(LS.ratings, [])
    const activeUserId = load<string | null>(LS.activeUserId, null)
    const syncConfig = load<SyncConfig | null>(LS.syncConfig, null)
    const tmdbApiKey = load<string | null>(LS.tmdbApiKey, null)
    const deletedUserIds = load<string[]>(LS.deletedUserIds, [])
    const deletedMovieIds = load<string[]>(LS.deletedMovieIds, [])
    const deletedRatingIds = load<string[]>(LS.deletedRatingIds, [])
    set({ users, movies, ratings, activeUserId, syncConfig, tmdbApiKey, deletedUserIds, deletedMovieIds, deletedRatingIds, hydrated: true })
  },

  addUser(fields) {
    const user: User = { ...fields, id: uid(), createdAt: new Date().toISOString() }
    const users = [...get().users, user]
    const activeUserId = get().activeUserId ?? user.id
    set({ users, activeUserId })
    save(LS.users, users)
    save(LS.activeUserId, activeUserId)
  },

  updateUser(id, patch) {
    const users = get().users.map(u => u.id === id ? { ...u, ...patch } : u)
    set({ users })
    save(LS.users, users)
  },

  deleteUser(id) {
    const users = get().users.filter(u => u.id !== id)
    const deletedUserIds = [...get().deletedUserIds, id]
    const activeUserId = get().activeUserId === id ? (users[0]?.id ?? null) : get().activeUserId
    set({ users, deletedUserIds, activeUserId })
    save(LS.users, users)
    save(LS.deletedUserIds, deletedUserIds)
    save(LS.activeUserId, activeUserId)
  },

  setActiveUser(id) {
    set({ activeUserId: id })
    save(LS.activeUserId, id)
  },

  addMovie(fields) {
    const movie: Movie = {
      ...fields,
      id: uid(),
      addedAt: new Date().toISOString(),
      watched: false,
      watchedAt: null,
      attendees: [],
    }
    const movies = [...get().movies, movie]
    set({ movies })
    save(LS.movies, movies)
  },

  updateMovie(id, patch) {
    const movies = get().movies.map(m => m.id === id ? { ...m, ...patch } : m)
    set({ movies })
    save(LS.movies, movies)
  },

  deleteMovie(id) {
    const movies = get().movies.filter(m => m.id !== id)
    const ratings = get().ratings.filter(r => r.movieId !== id)
    const deletedMovieIds = [...get().deletedMovieIds, id]
    set({ movies, ratings, deletedMovieIds })
    save(LS.movies, movies)
    save(LS.ratings, ratings)
    save(LS.deletedMovieIds, deletedMovieIds)
  },

  markWatched(id) {
    const movies = get().movies.map(m =>
      m.id === id ? { ...m, watched: true, watchedAt: new Date().toISOString() } : m
    )
    set({ movies })
    save(LS.movies, movies)
  },

  toggleAttendance(movieId) {
    const { activeUserId } = get()
    if (!activeUserId) return
    const movies = get().movies.map(m => {
      if (m.id !== movieId) return m
      const attendees = m.attendees ?? []
      const going = attendees.includes(activeUserId)
      return { ...m, attendees: going ? attendees.filter(id => id !== activeUserId) : [...attendees, activeUserId] }
    })
    set({ movies })
    save(LS.movies, movies)
  },

  addRating(fields) {
    const existing = get().ratings.find(r => r.movieId === fields.movieId && r.userId === fields.userId)
    let ratings: Rating[]
    if (existing) {
      ratings = get().ratings.map(r =>
        r.id === existing.id ? { ...r, ...fields, ratedAt: new Date().toISOString() } : r
      )
    } else {
      const rating: Rating = { ...fields, id: uid(), ratedAt: new Date().toISOString() }
      ratings = [...get().ratings, rating]
    }
    set({ ratings })
    save(LS.ratings, ratings)
  },

  updateRating(id, patch) {
    const ratings = get().ratings.map(r => r.id === id ? { ...r, ...patch } : r)
    set({ ratings })
    save(LS.ratings, ratings)
  },

  deleteRating(id) {
    const ratings = get().ratings.filter(r => r.id !== id)
    const deletedRatingIds = [...get().deletedRatingIds, id]
    set({ ratings, deletedRatingIds })
    save(LS.ratings, ratings)
    save(LS.deletedRatingIds, deletedRatingIds)
  },

  setSyncConfig(config) {
    set({ syncConfig: config })
    save(LS.syncConfig, config)
  },

  setTmdbApiKey(key) {
    set({ tmdbApiKey: key })
    save(LS.tmdbApiKey, key)
  },

  replaceAll({ users, movies, ratings }) {
    set({ users, movies, ratings })
    save(LS.users, users)
    save(LS.movies, movies)
    save(LS.ratings, ratings)
  },
}))
