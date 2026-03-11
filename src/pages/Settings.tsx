import { useState } from 'react'
import { useSync } from '../hooks/useSync'
import type { SyncConfig } from '../types'

function formatTs(ts: string | null) {
  if (!ts) return 'Never'
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function Settings() {
  const { sync, syncing, lastSynced, error, syncConfig, setSyncConfig } = useSync()
  const [editing, setEditing] = useState(false)
  const [pat, setPat] = useState(syncConfig?.pat ?? '')
  const [owner, setOwner] = useState(syncConfig?.owner ?? '')
  const [repo, setRepo] = useState(syncConfig?.repo ?? '')
  const [branch, setBranch] = useState(syncConfig?.branch ?? 'main')
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

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
            {syncing ? '⟳ Syncing…' : saved ? '✓ Synced!' : '↕ Sync Now'}
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
