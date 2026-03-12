import { NavLink } from 'react-router-dom'
import { IconHome, IconFilm, IconStar, IconUsers, IconSettings } from './Icons'

const TABS = [
  { to: '/', Icon: IconHome, label: 'Home', end: true },
  { to: '/upcoming', Icon: IconFilm, label: 'Upcoming' },
  { to: '/ratings', Icon: IconStar, label: 'Ratings' },
  { to: '/users', Icon: IconUsers, label: 'Users' },
  { to: '/settings', Icon: IconSettings, label: 'Settings' },
]

export function TabBar() {
  return (
    <nav className="tab-bar">
      {TABS.map(({ to, Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `tab-bar__item${isActive ? ' active' : ''}`}
        >
          <span className="tab-bar__icon"><Icon size={22} /></span>
          <span className="tab-bar__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
