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
  storeDirtyAt: 'cine-scores:storeDirtyAt',
  censorUntilRated: 'cine-scores:censorUntilRated',
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

function touch() {
  const ts = new Date().toISOString()
  localStorage.setItem(LS.storeDirtyAt, ts)
  return ts
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function migrateMovie(m: Movie): Movie {
  return {
    ...m,
    releaseDate: m.releaseDate ?? null,
    interestedUsers: m.interestedUsers ?? [],
    lastModified: m.lastModified ?? m.addedAt,
  }
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
  storeDirtyAt: null,
  censorUntilRated: false,

  hydrate() {
    const users = load<User[]>(LS.users, [])
    const rawMovies = load<Movie[]>(LS.movies, [])
    const movies = rawMovies.map(migrateMovie)
    const ratings = load<Rating[]>(LS.ratings, [])
    const activeUserId = load<string | null>(LS.activeUserId, null)
    const syncConfig = load<SyncConfig | null>(LS.syncConfig, null)
    const tmdbApiKey = load<string | null>(LS.tmdbApiKey, null)
    const deletedUserIds = load<string[]>(LS.deletedUserIds, [])
    const deletedMovieIds = load<string[]>(LS.deletedMovieIds, [])
    const deletedRatingIds = load<string[]>(LS.deletedRatingIds, [])
    // support legacy key 'cine-scores:lastModified' as fallback
    const storeDirtyAt =
      localStorage.getItem(LS.storeDirtyAt) ??
      localStorage.getItem('cine-scores:lastModified') ??
      null
    const censorUntilRated = load<boolean>(LS.censorUntilRated, false)
    set({ users, movies, ratings, activeUserId, syncConfig, tmdbApiKey, deletedUserIds, deletedMovieIds, deletedRatingIds, hydrated: true, storeDirtyAt, censorUntilRated })
  },

  addUser(fields) {
    const user: User = { ...fields, id: uid(), createdAt: new Date().toISOString() }
    const users = [...get().users, user]
    const activeUserId = get().activeUserId ?? user.id
    set({ users, activeUserId, storeDirtyAt: touch() })
    save(LS.users, users)
    save(LS.activeUserId, activeUserId)
  },

  updateUser(id, patch) {
    const users = get().users.map(u => u.id === id ? { ...u, ...patch } : u)
    set({ users, storeDirtyAt: touch() })
    save(LS.users, users)
  },

  deleteUser(id) {
    const users = get().users.filter(u => u.id !== id)
    const deletedUserIds = [...get().deletedUserIds, id]
    const activeUserId = get().activeUserId === id ? (users[0]?.id ?? null) : get().activeUserId
    set({ users, deletedUserIds, activeUserId, storeDirtyAt: touch() })
    save(LS.users, users)
    save(LS.deletedUserIds, deletedUserIds)
    save(LS.activeUserId, activeUserId)
  },

  setActiveUser(id) {
    set({ activeUserId: id })
    save(LS.activeUserId, id)
  },

  addMovie(fields) {
    const id = uid()
    const now = new Date().toISOString()
    const movie: Movie = {
      ...fields,
      id,
      addedAt: now,
      lastModified: now,
      watched: fields.watched ?? false,
      watchedAt: fields.watchedAt ?? null,
      attendees: [],
      interestedUsers: [],
      releaseDate: fields.releaseDate ?? null,
    }
    const movies = [...get().movies, movie]
    set({ movies, storeDirtyAt: touch() })
    save(LS.movies, movies)
    return id
  },

  updateMovie(id, patch) {
    const movies = get().movies.map(m =>
      m.id === id ? { ...m, ...patch, lastModified: new Date().toISOString() } : m
    )
    set({ movies, storeDirtyAt: touch() })
    save(LS.movies, movies)
  },

  deleteMovie(id) {
    const movies = get().movies.filter(m => m.id !== id)
    const ratings = get().ratings.filter(r => r.movieId !== id)
    const deletedMovieIds = [...get().deletedMovieIds, id]
    set({ movies, ratings, deletedMovieIds, storeDirtyAt: touch() })
    save(LS.movies, movies)
    save(LS.ratings, ratings)
    save(LS.deletedMovieIds, deletedMovieIds)
  },

  markWatched(id) {
    const now = new Date().toISOString()
    const movies = get().movies.map(m =>
      m.id === id ? { ...m, watched: true, watchedAt: now, lastModified: now } : m
    )
    set({ movies, storeDirtyAt: touch() })
    save(LS.movies, movies)
  },

  markUnwatched(id) {
    const now = new Date().toISOString()
    const movies = get().movies.map(m =>
      m.id === id ? { ...m, watched: false, watchedAt: null, lastModified: now } : m
    )
    set({ movies, storeDirtyAt: touch() })
    save(LS.movies, movies)
  },

  toggleAttendance(movieId) {
    const { activeUserId } = get()
    if (!activeUserId) return
    const now = new Date().toISOString()
    const movies = get().movies.map(m => {
      if (m.id !== movieId) return m
      const attendees = m.attendees ?? []
      const going = attendees.includes(activeUserId)
      return {
        ...m,
        attendees: going ? attendees.filter(id => id !== activeUserId) : [...attendees, activeUserId],
        lastModified: now,
      }
    })
    set({ movies, storeDirtyAt: touch() })
    save(LS.movies, movies)
  },

  toggleInterest(movieId) {
    const { activeUserId } = get()
    if (!activeUserId) return
    const now = new Date().toISOString()
    const movies = get().movies.map(m => {
      if (m.id !== movieId) return m
      const interested = m.interestedUsers ?? []
      const already = interested.includes(activeUserId)
      return {
        ...m,
        interestedUsers: already
          ? interested.filter(id => id !== activeUserId)
          : [...interested, activeUserId],
        lastModified: now,
      }
    })
    set({ movies, storeDirtyAt: touch() })
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
    set({ ratings, storeDirtyAt: touch() })
    save(LS.ratings, ratings)
  },

  updateRating(id, patch) {
    const ratings = get().ratings.map(r => r.id === id ? { ...r, ...patch } : r)
    set({ ratings, storeDirtyAt: touch() })
    save(LS.ratings, ratings)
  },

  deleteRating(id) {
    const ratings = get().ratings.filter(r => r.id !== id)
    const deletedRatingIds = [...get().deletedRatingIds, id]
    set({ ratings, deletedRatingIds, storeDirtyAt: touch() })
    save(LS.ratings, ratings)
    save(LS.deletedRatingIds, deletedRatingIds)
  },

  setCensorUntilRated(v) {
    set({ censorUntilRated: v })
    save(LS.censorUntilRated, v)
  },

  purgeOrphanRatings() {
    const { users, movies, ratings, deletedRatingIds } = get()
    const userIdSet = new Set(users.map(u => u.id))
    const movieIdSet = new Set(movies.map(m => m.id))

    // Remove ratings with deleted users or deleted movies
    const validRatings = ratings.filter(r => userIdSet.has(r.userId) && movieIdSet.has(r.movieId))

    // Remove duplicate (userId, movieId) pairs — keep most recent ratedAt
    const seen = new Map<string, Rating>()
    for (const r of validRatings) {
      const key = `${r.userId}:${r.movieId}`
      const existing = seen.get(key)
      if (!existing || r.ratedAt > existing.ratedAt) {
        seen.set(key, r)
      }
    }
    const dedupedRatings = Array.from(seen.values())

    const removedIds = ratings
      .filter(r => !dedupedRatings.some(d => d.id === r.id))
      .map(r => r.id)

    if (!removedIds.length) return
    const newDeletedRatingIds = [...deletedRatingIds, ...removedIds]
    set({ ratings: dedupedRatings, deletedRatingIds: newDeletedRatingIds, storeDirtyAt: touch() })
    save(LS.ratings, dedupedRatings)
    save(LS.deletedRatingIds, newDeletedRatingIds)
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
    localStorage.removeItem(LS.storeDirtyAt)
    const migratedMovies = movies.map(migrateMovie)
    set({ users, movies: migratedMovies, ratings, storeDirtyAt: null })
    save(LS.users, users)
    save(LS.movies, migratedMovies)
    save(LS.ratings, ratings)
  },
}))
