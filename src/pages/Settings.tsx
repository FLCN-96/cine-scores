import { useState } from 'react'
import { useSync } from '../hooks/useSync'
import { useStore } from '../store'
import { IconSync, IconCheck } from '../components/Icons'
import type { SyncConfig } from '../types'

function formatTs(ts: string | null) {
  if (!ts) return 'Never'
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function Settings() {
  const { sync, syncing, lastSynced, error, syncConfig, setSyncConfig } = useSync()
  const { tmdbApiKey, setTmdbApiKey } = useStore()
  const [editing, setEditing] = useState(false)
  const [pat, setPat] = useState(syncConfig?.pat ?? '')
  const [owner, setOwner] = useState(syncConfig?.owner ?? '')
  const [repo, setRepo] = useState(syncConfig?.repo ?? '')
  const [branch, setBranch] = useState(syncConfig?.branch ?? 'main')
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [tmdbKey, setTmdbKey] = useState(tmdbApiKey ?? '')
  const [tmdbSaved, setTmdbSaved] = useState(false)

  function handleTmdbSave(e: React.FormEvent) {
    e.preventDefault()
    setTmdbApiKey(tmdbKey.trim() || null)
    setTmdbSaved(true)
    setTimeout(() => setTmdbSaved(false), 2000)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!pat.trim() || !owner.trim() || !repo.trim()) return
    const config: SyncConfig = { pat: pat.trim(), owner: owner.trim(), repo: repo.trim(), branch: branch.trim() || 'main' }
    setSyncConfig(config)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClear() {
    setSyncConfig(null)
    setPat('')
    setOwner('')
    setRepo('')
    setBranch('main')
    setConfirmClear(false)
  }

  const isConfigured = !!syncConfig

  return (
    <div className="app-content">
      <div className="page">
        <div className="page-header">
          <div className="page-title">Settings</div>
        </div>

        {/* Sync Status */}
        <div className="status-card">
          <div className={`status-dot ${isConfigured ? 'status-dot--ok' : 'status-dot--warn'}`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>GitHub Sync</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {isConfigured ? `${syncConfig.owner}/${syncConfig.repo} · ${syncConfig.branch}` : 'Not configured'}
            </div>
          </div>
        </div>

        {isConfigured && (
          <div className="status-card">
            <div className={`status-dot ${error ? 'status-dot--err' : 'status-dot--ok'}`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Last synced</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formatTs(lastSynced)}</div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', fontSize: 14, color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        {isConfigured && !editing && (
          <button
            className={`btn btn--full btn--primary${saved ? ' btn--saved' : ''}`}
            onClick={() => sync()}
            disabled={syncing}
            style={{ marginBottom: 'var(--space-md)' }}
          >
            {syncing ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconSync size={15} />Syncing…</span>
            ) : saved ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconCheck size={15} />Synced!</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconSync size={15} />Sync Now</span>
            )}
          </button>
        )}

        {/* Config form */}
        {(!isConfigured || editing) ? (
          <div className="section">
            <div className="section-title">GitHub Configuration</div>
            <div className="sync-hint">
              Data is stored as JSON files in your GitHub repository. You need a fine-grained Personal Access Token with read/write access to the repo contents.
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Personal Access Token</label>
                <input
                  type="password"
                  value={pat}
                  onChange={e => setPat(e.target.value)}
                  placeholder="ghp_…"
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label>Owner (username or org)</label>
                <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="your-username" />
              </div>
              <div className="form-group">
                <label>Repository</label>
                <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="cine-scores-data" />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                {editing && (
                  <button type="button" className="btn btn--secondary btn--full" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn--primary btn--full" disabled={!pat.trim() || !owner.trim() || !repo.trim()}>
                  Save Config
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button className="btn btn--ghost" onClick={() => setEditing(true)} style={{ marginBottom: 'var(--space-md)' }}>
            Edit GitHub Config
          </button>
        )}

        {/* TMDB API */}
        <div className="section" style={{ marginTop: 'var(--space-md)' }}>
          <div className="section-title">TMDB Integration</div>
          <div className="sync-hint">
            A free TMDB API key enables automatic poster and metadata lookup when adding movies.
            Get one at <strong>themoviedb.org/settings/api</strong>.
          </div>
          <form onSubmit={handleTmdbSave}>
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={tmdbKey}
                onChange={e => setTmdbKey(e.target.value)}
                placeholder="Paste your TMDB API key…"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className={`btn btn--full ${tmdbSaved ? 'btn--saved' : 'btn--primary'}`}
            >
              {tmdbSaved ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconCheck size={14} />Saved!</span>
              ) : tmdbApiKey ? 'Update Key' : 'Save Key'}
            </button>
          </form>
        </div>

        {/* About */}
        <div className="section" style={{ marginTop: 'var(--space-md)' }}>
          <div className="section-title">About</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <strong>CineScores</strong> — Schedule and rate movies with your friend group.<br /><br />
            Data is stored locally on this device. Enable GitHub sync to share ratings across your group.
          </div>
        </div>

        {/* Danger Zone */}
        {isConfigured && (
          <div className="section" style={{ marginTop: 'var(--space-md)' }}>
            <div className="section-title">Danger Zone</div>
            {confirmClear ? (
              <div className="confirm-row">
                <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  Remove sync config?
                </span>
                <button className="btn btn--secondary btn--sm" onClick={() => setConfirmClear(false)}>Cancel</button>
                <button className="btn btn--danger btn--sm" onClick={handleClear}>Remove</button>
              </div>
            ) : (
              <button className="btn btn--ghost" style={{ color: 'var(--color-danger)' }} onClick={() => setConfirmClear(true)}>
                Remove Sync Config
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
