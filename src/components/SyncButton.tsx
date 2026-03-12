import { useSync } from '../hooks/useSync'
import { IconSync } from './Icons'

export function SyncButton() {
  const { sync, syncing, error, syncConfig, isDirty } = useSync()

  if (!syncConfig) return null

  return (
    <button
      className={`sync-btn${isDirty ? ' sync-btn--dirty' : ''}${syncing ? ' sync-btn--syncing' : ''}`}
      onClick={sync}
      disabled={syncing}
      title={error ?? (isDirty ? 'Unsynced changes — tap to sync' : 'Tap to sync')}
      aria-label="Sync to GitHub"
    >
      <IconSync size={16} className="sync-btn__icon" />
      {isDirty && !syncing && <span className="sync-btn__dot" />}
      {error && !syncing && <span className="sync-btn__dot sync-btn__dot--error" />}
    </button>
  )
}
