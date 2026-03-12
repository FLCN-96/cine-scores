import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import { TabBar } from './components/TabBar'
import { SyncButton } from './components/SyncButton'
import { Home } from './pages/Home'
import { Upcoming } from './pages/Upcoming'
import { Ratings } from './pages/Ratings'
import { Users } from './pages/Users'
import { Settings } from './pages/Settings'

export function App() {
  const { hydrated, hydrate } = useStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated) return null

  return (
    <div className="app-shell">
      <SyncButton />
      <div className="app-content" style={{ padding: 0 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/ratings" element={<Ratings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <TabBar />
    </div>
  )
}
