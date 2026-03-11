import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', icon: '🏠', label: 'Home', end: true },
  { to: '/upcoming', icon: '🎬', label: 'Upcoming' },
  { to: '/ratings', icon: '⭐', label: 'Ratings' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export function TabBar() {
  return (
    <nav className="tab-bar">
      {TABS.map(({ to, icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `tab-bar__item${isActive ? ' active' : ''}`}
        >
          <span className="tab-bar__icon">{icon}</span>
          <span className="tab-bar__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
