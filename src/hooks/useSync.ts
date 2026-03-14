import { useState, useCallback, useEffect } from 'react'
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

const GH_HEADERS = (pat: string) => ({
  Authorization: `Bearer ${pat}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

async function ghFetch(pat: string, owner: string, repo: string, branch: string, path: string): Promise<FileMeta | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: GH_HEADERS(pat) }
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
      headers: { ...GH_HEADERS(pat), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Repo "${owner}/${repo}" not found (404) — check your owner/repo name and that the repo exists`)
    if (res.status === 401) throw new Error('Invalid PAT (401) — check your Personal Access Token')
    if (res.status === 403) throw new Error('PAT lacks repo write permission (403) — enable Contents read+write')
    if (res.status === 409) throw new Error('Conflict (409) — another push is in progress, try again')
    if (res.status === 422) throw new Error('SHA conflict (422) — try syncing again to refresh')
    throw new Error(`GitHub push failed: ${res.status}`)
  }
}

function mergeData(local: RemoteData, remote: RemoteData, deletedUserIds: string[], deletedMovieIds: string[], deletedRatingIds: string[]): RemoteData {
  // Users: local wins for same ID, remote-only added (excluding tombstones)
  const userMap = new Map<string, User>()
  for (const u of remote.users) {
    if (!deletedUserIds.includes(u.id)) userMap.set(u.id, u)
  }
  for (const u of local.users) userMap.set(u.id, u)
  const users = Array.from(userMap.values())

  // Movies: use per-movie lastModified to pick the newer version; respect tombstones
  const movieMap = new Map<string, Movie>()
  for (const m of remote.movies) {
    if (!deletedMovieIds.includes(m.id)) movieMap.set(m.id, m)
  }
  for (const m of local.movies) {
    if (deletedMovieIds.includes(m.id)) continue
    const existing = movieMap.get(m.id)
    if (!existing) {
      movieMap.set(m.id, m)
    } else {
      // Pick whichever was modified more recently
      const localTs = m.lastModified ?? m.addedAt
      const remoteTs = existing.lastModified ?? existing.addedAt
      if (new Date(localTs) > new Date(remoteTs)) {
        movieMap.set(m.id, m)
      }
    }
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
  const { syncConfig, storeDirtyAt, replaceAll, setSyncConfig } = useStore()
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(() => localStorage.getItem('cine-scores:lastSynced'))
  const [error, setError] = useState<string | null>(null)

  const isDirty = !!storeDirtyAt

  const sync = useCallback(async () => {
    if (!syncConfig || syncing) return
    setSyncing(true)
    setError(null)
    try {
      const { pat, owner, repo, branch } = syncConfig

      // Read fresh state at sync time to avoid stale closure dropping recent mutations
      const { users, movies, ratings, deletedUserIds, deletedMovieIds, deletedRatingIds } = useStore.getState()

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

      await ghPush(pat, owner, repo, branch, 'data/users.json', JSON.stringify(merged.users, null, 2), uf?.sha ?? null)
      await ghPush(pat, owner, repo, branch, 'data/movies.json', JSON.stringify(merged.movies, null, 2), mf?.sha ?? null)
      await ghPush(pat, owner, repo, branch, 'data/ratings.json', JSON.stringify(merged.ratings, null, 2), rf?.sha ?? null)

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
  }, [syncConfig, syncing, replaceAll])

  // Auto-sync when user returns to the tab if there are pending local changes
  useEffect(() => {
    const handler = () => {
      if (!document.hidden && isDirty && syncConfig && !syncing) {
        sync()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [isDirty, syncConfig, syncing, sync])

  return { sync, syncing, lastSynced, error, syncConfig, setSyncConfig, isDirty }
}
