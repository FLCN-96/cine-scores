import { useState, useCallback } from 'react'
import { useStore } from '../store'
import type { User, Movie, Rating } from '../types'

interface RemoteData {
  users: User[]
  movies: Movie[]
  ratings: Rating[]
}

interface FileMeta {
  content: string
  sha: string
}

async function ghFetch(pat: string, owner: string, repo: string, branch: string, path: string): Promise<FileMeta | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github+json' } }
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`)
  const json = await res.json()
  return { content: atob(json.content.replace(/\n/g, '')), sha: json.sha }
}

async function ghPush(pat: string, owner: string, repo: string, branch: string, path: string, content: string, sha: string | null) {
  const body: Record<string, unknown> = {
    message: `sync: update ${path}`,
    content: btoa(content),
    branch,
  }
  if (sha) body.sha = sha
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`GitHub push failed: ${res.status}`)
}

function mergeData(local: RemoteData, remote: RemoteData, deletedUserIds: string[], deletedMovieIds: string[], deletedRatingIds: string[]): RemoteData {
  // Users: local wins for same ID, remote-only added (excluding tombstones)
  const userMap = new Map<string, User>()
  for (const u of remote.users) {
    if (!deletedUserIds.includes(u.id)) userMap.set(u.id, u)
  }
  for (const u of local.users) userMap.set(u.id, u)
  const users = Array.from(userMap.values())

  // Movies: remote wins for existing; local-only preserved
  const movieMap = new Map<string, Movie>()
  for (const m of remote.movies) {
    if (!deletedMovieIds.includes(m.id)) movieMap.set(m.id, m)
  }
  for (const m of local.movies) {
    if (!movieMap.has(m.id)) movieMap.set(m.id, m)
  }
  const movies = Array.from(movieMap.values())

  // Ratings: remote wins; local-only preserved
  const ratingMap = new Map<string, Rating>()
  for (const r of remote.ratings) {
    if (!deletedRatingIds.includes(r.id)) ratingMap.set(r.id, r)
  }
  for (const r of local.ratings) {
    if (!ratingMap.has(r.id)) ratingMap.set(r.id, r)
  }
  const ratings = Array.from(ratingMap.values())

  return { users, movies, ratings }
}

export function useSync() {
  const { syncConfig, users, movies, ratings, deletedUserIds, deletedMovieIds, deletedRatingIds, replaceAll, setSyncConfig } = useStore()
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(() => localStorage.getItem('cine-scores:lastSynced'))
  const [error, setError] = useState<string | null>(null)

  const sync = useCallback(async () => {
    if (!syncConfig || syncing) return
    setSyncing(true)
    setError(null)
    try {
      const { pat, owner, repo, branch } = syncConfig

      const [uf, mf, rf] = await Promise.all([
        ghFetch(pat, owner, repo, branch, 'data/users.json'),
        ghFetch(pat, owner, repo, branch, 'data/movies.json'),
        ghFetch(pat, owner, repo, branch, 'data/ratings.json'),
      ])

      const remote: RemoteData = {
        users: uf ? JSON.parse(uf.content) : [],
        movies: mf ? JSON.parse(mf.content) : [],
        ratings: rf ? JSON.parse(rf.content) : [],
      }

      const merged = mergeData(
        { users, movies, ratings },
        remote,
        deletedUserIds,
        deletedMovieIds,
        deletedRatingIds,
      )

      await Promise.all([
        ghPush(pat, owner, repo, branch, 'data/users.json', JSON.stringify(merged.users, null, 2), uf?.sha ?? null),
        ghPush(pat, owner, repo, branch, 'data/movies.json', JSON.stringify(merged.movies, null, 2), mf?.sha ?? null),
        ghPush(pat, owner, repo, branch, 'data/ratings.json', JSON.stringify(merged.ratings, null, 2), rf?.sha ?? null),
      ])

      replaceAll(merged)

      // Clear tombstones after successful sync
      localStorage.removeItem('cine-scores:deletedUserIds')
      localStorage.removeItem('cine-scores:deletedMovieIds')
      localStorage.removeItem('cine-scores:deletedRatingIds')
      useStore.setState({ deletedUserIds: [], deletedMovieIds: [], deletedRatingIds: [] })

      const ts = new Date().toISOString()
      setLastSynced(ts)
      localStorage.setItem('cine-scores:lastSynced', ts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [syncConfig, users, movies, ratings, deletedUserIds, deletedMovieIds, deletedRatingIds, replaceAll])

  return { sync, syncing, lastSynced, error, syncConfig, setSyncConfig }
}
