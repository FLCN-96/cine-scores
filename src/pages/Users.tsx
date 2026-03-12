import { useState } from 'react'
import { useStore } from '../store'
import { IconUsers } from '../components/Icons'
import type { User } from '../types'

const COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e91e63', '#00bcd4', '#ff5722',
  '#795548', '#607d8b',
]

interface UserSheetProps {
  title: string
  initial?: Partial<User>
  onSave: (fields: { name: string; color: string }) => void
  onClose: () => void
  submitLabel?: string
}

function UserSheet({ title, initial, onSave, onClose, submitLabel = 'Save' }: UserSheetProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])

  return (
    <div className="overlay overlay--center" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>

        <div className="sheet-topbar">
          <div className="sheet-title" style={{ marginBottom: 0 }}>{title}</div>
        </div>

        <div className="sheet-body">
          <form id="user-sheet-form" onSubmit={e => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), color }) }}>
            <div className="form-group">
              <label>Name</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch${color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="sheet-footer">
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button type="button" className="btn btn--secondary btn--full" onClick={onClose}>Cancel</button>
            <button type="submit" form="user-sheet-form" className="btn btn--primary btn--full" disabled={!name.trim()}>{submitLabel}</button>
          </div>
        </div>

      </div>
    </div>
  )
}

export function Users() {
  const { users, activeUserId, setActiveUser, addUser, updateUser, deleteUser, ratings } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const editingUser = editingId ? users.find(u => u.id === editingId) : null

  return (
    <div className="app-content">
      <div className="page">
        <div className="page-header">
          <div className="page-title">Users</div>
          <button className="btn btn--primary btn--sm" onClick={() => setShowAdd(true)}>
            + Add
          </button>
        </div>

        {users.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon"><IconUsers size={44} /></div>
            <div className="empty-state__text">Add your friend group to get started!</div>
          </div>
        )}

        {users.map(user => {
          const userRatings = ratings.filter(r => r.userId === user.id)
          const isActive = user.id === activeUserId
          const isConfirmingDelete = confirmDeleteId === user.id

          return (
            <div
              key={user.id}
              className="section"
              style={{ cursor: 'pointer', border: isActive ? `2px solid ${user.color}` : '2px solid transparent' }}
              onClick={() => setActiveUser(user.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div className="avatar avatar--lg" style={{ background: user.color }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    {user.name}
                    {isActive && (
                      <span style={{ fontSize: 11, background: user.color, color: '#fff', borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>
                        Active
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                    {userRatings.length} rating{userRatings.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={e => { e.stopPropagation(); setEditingId(user.id) }}
                >
                  Edit
                </button>
              </div>

              {isConfirmingDelete ? (
                <div className="confirm-row" style={{ marginTop: 'var(--space-md)' }} onClick={e => e.stopPropagation()}>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    Delete {user.name}?
                  </span>
                  <button className="btn btn--secondary btn--sm" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                  <button className="btn btn--danger btn--sm" onClick={() => { deleteUser(user.id); setConfirmDeleteId(null) }}>Delete</button>
                </div>
              ) : (
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ color: 'var(--color-danger)', marginTop: 'var(--space-md)' }}
                  onClick={e => { e.stopPropagation(); setConfirmDeleteId(user.id) }}
                >
                  Delete
                </button>
              )}
            </div>
          )
        })}

        <div className="sync-hint" style={{ marginTop: 'var(--space-md)' }}>
          Tap a user card to set them as the active user. Ratings and additions will be attributed to the active user.
        </div>
      </div>

      {showAdd && (
        <UserSheet
          title="New User"
          submitLabel="Add User"
          onSave={fields => { addUser(fields); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editingUser && (
        <UserSheet
          title={`Edit ${editingUser.name}`}
          initial={editingUser}
          onSave={fields => { updateUser(editingUser.id, fields); setEditingId(null) }}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}
