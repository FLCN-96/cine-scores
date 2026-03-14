export interface User {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface Movie {
  id: string
  title: string
  year: number | null
  genre: string
  posterUrl: string
  description: string
  releaseDate: string | null
  scheduledDate: string | null
  addedBy: string
  addedAt: string
  tmdbId: number | null
  watched: boolean
  watchedAt: string | null
  attendees: string[]
  interestedUsers: string[]
  lastModified: string
}

export interface Rating {
  id: string
  movieId: string
  userId: string
  score: number
  review: string
  ratedAt: string
}

export interface SyncConfig {
  pat: string
  owner: string
  repo: string
  branch: string
}

export interface AppState {
  users: User[]
  movies: Movie[]
  ratings: Rating[]
  activeUserId: string | null
  syncConfig: SyncConfig | null
  tmdbApiKey: string | null
  deletedUserIds: string[]
  deletedMovieIds: string[]
  deletedRatingIds: string[]
  hydrated: boolean
  storeDirtyAt: string | null

  // User actions
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void
  updateUser: (id: string, patch: Partial<Omit<User, 'id'>>) => void
  deleteUser: (id: string) => void
  setActiveUser: (id: string) => void

  // Movie actions
  addMovie: (movie: Omit<Movie, 'id' | 'addedAt' | 'attendees' | 'interestedUsers' | 'lastModified'> & { watched?: boolean; watchedAt?: string | null }) => string
  updateMovie: (id: string, patch: Partial<Omit<Movie, 'id'>>) => void
  deleteMovie: (id: string) => void
  markWatched: (id: string) => void
  markUnwatched: (id: string) => void
  toggleAttendance: (movieId: string) => void
  toggleInterest: (movieId: string) => void

  // Rating actions
  addRating: (rating: Omit<Rating, 'id' | 'ratedAt'>) => void
  updateRating: (id: string, patch: Partial<Omit<Rating, 'id'>>) => void
  deleteRating: (id: string) => void

  // Ratings preferences
  censorUntilRated: boolean
  setCensorUntilRated: (v: boolean) => void
  purgeOrphanRatings: () => void

  // Sync actions
  setSyncConfig: (config: SyncConfig | null) => void
  setTmdbApiKey: (key: string | null) => void
  hydrate: () => void
  replaceAll: (data: { users: User[]; movies: Movie[]; ratings: Rating[] }) => void
}
